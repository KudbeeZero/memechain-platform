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
  Global,
  assert,
  emit,
  arc4,
  gtxn,
  itxn,
} from '@algorandfoundation/algorand-typescript'

/** ARC-28 event emitted on deposit */
class DepositEvent extends arc4.Struct<{
  depositor: arc4.Address
  amount: arc4.Uint64
}> {}

/** ARC-28 event emitted on withdrawal */
class WithdrawEvent extends arc4.Struct<{
  recipient: arc4.Address
  amount: arc4.Uint64
}> {}

/**
 * MemeVault — an ARC-4 vault contract for holding and distributing ALGO.
 *
 * Demonstrates inner transactions, payment handling, and box storage.
 * Compiled via puya-ts → TEAL with ARC-56 app spec.
 */
export class MemeVault extends Contract {
  /** Contract admin */
  admin = GlobalState<bytes>({ key: 'admin' })

  /** Total ALGO deposited into the vault */
  totalDeposits = GlobalState<uint64>({ key: 'total_deposits' })

  /** Per-account deposit tracking */
  deposits = BoxMap<bytes, uint64>({ keyPrefix: 'dep_' })

  // ── Lifecycle ──────────────────────────────────────────────

  @baremethod({ onCreate: 'require', allowActions: 'NoOp' })
  createApplication(): void {
    this.admin.value = Txn.sender.bytes
    this.totalDeposits.value = 0
  }

  @baremethod({ allowActions: 'DeleteApplication' })
  deleteApplication(): void {
    assert(Txn.sender.bytes === this.admin.value, 'Only admin')
    assert(this.totalDeposits.value === 0, 'Vault not empty')
  }

  // ── Deposit ────────────────────────────────────────────────

  @abimethod()
  deposit(payment: gtxn.PaymentTxn): void {
    assert(payment.receiver === Global.currentApplicationAddress, 'Payment must be to app')
    assert(payment.amount > 0, 'Must deposit > 0')

    const depositorKey = payment.sender.bytes
    const amount = payment.amount

    let currentDeposit: uint64 = 0
    if (this.deposits(depositorKey).exists) {
      currentDeposit = this.deposits(depositorKey).value
    }

    this.deposits(depositorKey).value = currentDeposit + amount
    this.totalDeposits.value = this.totalDeposits.value + amount

    emit(new DepositEvent({
      depositor: new arc4.Address(payment.sender),
      amount: new arc4.Uint64(amount),
    }))
  }

  // ── Withdraw ───────────────────────────────────────────────

  @abimethod()
  withdraw(amount: arc4.Uint64): void {
    const withdrawAmount = amount.asUint64()
    const senderKey = Txn.sender.bytes

    assert(this.deposits(senderKey).exists, 'No deposits found')
    const currentDeposit = this.deposits(senderKey).value
    assert(currentDeposit >= withdrawAmount, 'Insufficient deposit')

    this.deposits(senderKey).value = currentDeposit - withdrawAmount
    this.totalDeposits.value = this.totalDeposits.value - withdrawAmount

    // Inner transaction to send ALGO back
    itxn.payment({
      receiver: Txn.sender,
      amount: withdrawAmount,
      fee: 0,
    }).submit()

    emit(new WithdrawEvent({
      recipient: new arc4.Address(Txn.sender),
      amount: amount,
    }))
  }

  // ── Admin withdraw (emergency) ─────────────────────────────

  @abimethod()
  adminWithdraw(to: arc4.Address, amount: arc4.Uint64): void {
    assert(Txn.sender.bytes === this.admin.value, 'Only admin')

    itxn.payment({
      receiver: to.native,
      amount: amount.asUint64(),
      fee: 0,
    }).submit()

    this.totalDeposits.value = this.totalDeposits.value - amount.asUint64()

    emit(new WithdrawEvent({
      recipient: to,
      amount: amount,
    }))
  }

  // ── Read-only ──────────────────────────────────────────────

  @abimethod({ readonly: true })
  getDeposit(account: arc4.Address): arc4.Uint64 {
    const key = account.native.bytes
    if (this.deposits(key).exists) {
      return new arc4.Uint64(this.deposits(key).value)
    }
    return new arc4.Uint64(0)
  }

  @abimethod({ readonly: true })
  getTotalDeposits(): arc4.Uint64 {
    return new arc4.Uint64(this.totalDeposits.value)
  }

  @abimethod({ readonly: true })
  getAdmin(): arc4.Address {
    return new arc4.Address(this.admin.value)
  }
}
