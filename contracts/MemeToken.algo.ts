import {
  Contract,
  abimethod,
  baremethod,
  GlobalState,
  BoxMap,
  bytes,
  uint64,
  Bytes,
  Txn,
  assert,
  emit,
  arc4,
} from '@algorandfoundation/algorand-typescript'

/** ARC-28 event emitted on token transfer */
class TransferEvent extends arc4.Struct<{
  from: arc4.Address
  to: arc4.Address
  amount: arc4.Uint64
}> {}

/** ARC-28 event emitted on minting */
class MintEvent extends arc4.Struct<{
  to: arc4.Address
  amount: arc4.Uint64
}> {}

/**
 * MemeToken — an ARC-4 compliant smart contract for the MemeChain platform.
 *
 * Compiled via puya-ts → TEAL with ARC-56 app spec output.
 * Deployed on Algorand TestNet.
 */
export class MemeToken extends Contract {
  /** Token name */
  name = GlobalState<bytes>({ key: 'name' })

  /** Token symbol */
  symbol = GlobalState<bytes>({ key: 'symbol' })

  /** Total supply of the token */
  totalSupply = GlobalState<uint64>({ key: 'total_supply' })

  /** Contract admin (deployer) */
  admin = GlobalState<bytes>({ key: 'admin' })

  /** Whether the contract is paused */
  paused = GlobalState<uint64>({ key: 'paused' })

  /** Per-account balance stored in boxes */
  balances = BoxMap<bytes, uint64>({ keyPrefix: 'bal_' })

  /** Per-account allowance stored in boxes: key = owner+spender */
  allowances = BoxMap<bytes, uint64>({ keyPrefix: 'alw_' })

  // ── Lifecycle ──────────────────────────────────────────────

  @baremethod({ onCreate: 'require', allowActions: 'NoOp' })
  createApplication(): void {
    this.name.value = Bytes('MemeToken')
    this.symbol.value = Bytes('MEME')
    this.totalSupply.value = 0
    this.admin.value = Txn.sender.bytes
    this.paused.value = 0
  }

  @baremethod({ allowActions: 'DeleteApplication' })
  deleteApplication(): void {
    assert(Txn.sender.bytes === this.admin.value, 'Only admin can delete')
  }

  @baremethod({ allowActions: 'UpdateApplication' })
  updateApplication(): void {
    assert(Txn.sender.bytes === this.admin.value, 'Only admin can update')
  }

  // ── Admin ──────────────────────────────────────────────────

  @abimethod()
  bootstrap(tokenName: arc4.Str, tokenSymbol: arc4.Str, initialSupply: arc4.Uint64): arc4.Uint64 {
    assert(Txn.sender.bytes === this.admin.value, 'Only admin can bootstrap')
    assert(this.totalSupply.value === 0, 'Already bootstrapped')

    this.name.value = Bytes(tokenName.native)
    this.symbol.value = Bytes(tokenSymbol.native)
    this.totalSupply.value = initialSupply.asUint64()

    // Credit admin with entire initial supply
    const adminKey = Txn.sender.bytes
    this.balances(adminKey).value = initialSupply.asUint64()

    emit(new MintEvent({
      to: new arc4.Address(Txn.sender),
      amount: initialSupply,
    }))

    return initialSupply
  }

  @abimethod()
  pause(): void {
    assert(Txn.sender.bytes === this.admin.value, 'Only admin')
    this.paused.value = 1
  }

  @abimethod()
  unpause(): void {
    assert(Txn.sender.bytes === this.admin.value, 'Only admin')
    this.paused.value = 0
  }

  // ── Transfers ──────────────────────────────────────────────

  @abimethod()
  transfer(to: arc4.Address, amount: arc4.Uint64): arc4.Bool {
    assert(this.paused.value === 0, 'Contract is paused')

    const fromKey = Txn.sender.bytes
    const toKey = to.native.bytes
    const transferAmount = amount.asUint64()

    const fromBalance = this.balances(fromKey).value
    assert(fromBalance >= transferAmount, 'Insufficient balance')

    this.balances(fromKey).value = fromBalance - transferAmount

    let toBalance: uint64 = 0
    if (this.balances(toKey).exists) {
      toBalance = this.balances(toKey).value
    }
    this.balances(toKey).value = toBalance + transferAmount

    emit(new TransferEvent({
      from: new arc4.Address(Txn.sender),
      to: to,
      amount: amount,
    }))

    return new arc4.Bool(true)
  }

  @abimethod()
  mint(to: arc4.Address, amount: arc4.Uint64): void {
    assert(Txn.sender.bytes === this.admin.value, 'Only admin can mint')
    assert(this.paused.value === 0, 'Contract is paused')

    const toKey = to.native.bytes
    const mintAmount = amount.asUint64()

    let toBalance: uint64 = 0
    if (this.balances(toKey).exists) {
      toBalance = this.balances(toKey).value
    }
    this.balances(toKey).value = toBalance + mintAmount
    this.totalSupply.value = this.totalSupply.value + mintAmount

    emit(new MintEvent({
      to: to,
      amount: amount,
    }))
  }

  // ── Read-only queries ──────────────────────────────────────

  @abimethod({ readonly: true })
  getBalance(account: arc4.Address): arc4.Uint64 {
    const key = account.native.bytes
    if (this.balances(key).exists) {
      return new arc4.Uint64(this.balances(key).value)
    }
    return new arc4.Uint64(0)
  }

  @abimethod({ readonly: true })
  getTotalSupply(): arc4.Uint64 {
    return new arc4.Uint64(this.totalSupply.value)
  }

  @abimethod({ readonly: true })
  getName(): arc4.Str {
    return new arc4.Str(this.name.value.toString())
  }

  @abimethod({ readonly: true })
  getSymbol(): arc4.Str {
    return new arc4.Str(this.symbol.value.toString())
  }

  @abimethod({ readonly: true })
  isPaused(): arc4.Bool {
    return new arc4.Bool(this.paused.value === 1)
  }

  @abimethod({ readonly: true })
  getAdmin(): arc4.Address {
    return new arc4.Address(this.admin.value)
  }
}
