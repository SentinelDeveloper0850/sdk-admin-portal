"use client";

import { Button, Drawer, Form, Input, InputNumber, Select, Space } from "antd";
import { useEffect } from "react";

type Receipt = {
    _id: string;
    invoiceNumber?: string | null;
    paymentMethod?: string | null;
    submittedAmount?: number | null;
    cashAmount?: number | null;
    cardAmount?: number | null;
    bankDepositReference?: string | null;
    bankName?: string | null;
    depositorName?: string | null;
    receiptType?: string | null;
    notes?: string | null;
    submittedAt?: string | null;
    files: string[];
};

export default function ReceiptEditDrawer({
    open,
    onClose,
    receipt,
    submissionId,
    disabled,
    onUpdated,
}: {
    open: boolean;
    onClose: () => void;
    receipt: Receipt | null;
    submissionId: string;
    disabled?: boolean;
    onUpdated: (updatedReceipt: Receipt) => void;
}) {
    const [form] = Form.useForm();

    // Refill when receipt changes
    useEffect(() => {
        if (receipt) {
            form.setFieldsValue({
                invoiceNumber: receipt.invoiceNumber ?? null,
                receiptType: receipt.receiptType ?? null,
                paymentMethod: receipt.paymentMethod ?? null,
                submittedAmount: receipt.submittedAmount ?? null,
                cashAmount: receipt.cashAmount ?? null,
                cardAmount: receipt.cardAmount ?? null,
                bankDepositReference: receipt.bankDepositReference ?? null,
                bankName: receipt.bankName ?? null,
                depositorName: receipt.depositorName ?? null,
                notes: receipt.notes ?? null,
            });
        } else {
            form.resetFields();
        }
    }, [receipt, form]);

    const paymentMethod = Form.useWatch("paymentMethod", form);

    const onSave = async () => {
        const values = await form.validateFields();

        // Normalize amounts depending on payment method
        const pm = values.paymentMethod;
        const submittedAmount = Number(values.submittedAmount ?? 0);

        let cashAmount = values.cashAmount ?? null;
        let cardAmount = values.cardAmount ?? null;

        if (pm === "cash") {
            cashAmount = submittedAmount;
            cardAmount = null;
        } else if (pm === "card") {
            cashAmount = null;
            cardAmount = submittedAmount;
        } else if (pm === "both") {
            cashAmount = Number(values.cashAmount ?? 0);
            cardAmount = Number(values.cardAmount ?? 0);
            // Optional: enforce sum matches submittedAmount
            if (cashAmount + cardAmount !== submittedAmount) {
                throw new Error("Cash + Card must equal Submitted Amount");
            }
        }

        const payload = {
            submissionId,
            receiptId: receipt?._id,
            patch: {
                ...values,
                submittedAmount,
                cashAmount,
                cardAmount,
            },
        };

        const res = await fetch("/api/cash-up/update-receipt", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const json = await res.json();

        if (!json.success) throw new Error(json.message || "Failed to update receipt");

        // server should return updated receipt
        onUpdated(json.receipt);
        onClose();
    };

    return (
        <Drawer
            title="Edit Receipt"
            open={open}
            onClose={onClose}
            width={520}
            destroyOnClose
            extra={
                <Space>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button type="primary" onClick={onSave} disabled={disabled || !receipt}>
                        Save
                    </Button>
                </Space>
            }
        >
            {!receipt ? null : (
                <Form form={form} layout="vertical">
                    <Form.Item name="receiptType" label="Receipt Type">
                        <Select
                            allowClear
                            options={[
                                { value: "policy", label: "Policy" },
                                { value: "funeral", label: "Funeral" },
                                { value: "sales", label: "Sales" },
                            ]}
                        />
                    </Form.Item>

                    <Form.Item name="invoiceNumber" label="Invoice Number">
                        <Input placeholder="Optional" />
                    </Form.Item>

                    <Form.Item
                        name="paymentMethod"
                        label="Payment Method"
                        rules={[{ required: true, message: "Payment method is required" }]}
                    >
                        <Select
                            options={[
                                { value: "cash", label: "Cash" },
                                { value: "card", label: "Card" },
                                { value: "both", label: "Both" },
                                { value: "bank_deposit", label: "Bank Deposit" },
                            ]}
                        />
                    </Form.Item>

                    <Form.Item
                        name="submittedAmount"
                        label="Submitted Amount"
                        rules={[{ required: true, message: "Amount is required" }]}
                    >
                        <InputNumber className="w-full" min={0} />
                    </Form.Item>

                    {paymentMethod === "both" && (
                        <>
                            <Form.Item name="cashAmount" label="Cash Amount" rules={[{ required: true }]}>
                                <InputNumber className="w-full" min={0} />
                            </Form.Item>
                            <Form.Item name="cardAmount" label="Card Amount" rules={[{ required: true }]}>
                                <InputNumber className="w-full" min={0} />
                            </Form.Item>
                        </>
                    )}

                    {paymentMethod === "bank_deposit" && (
                        <>
                            <Form.Item name="bankDepositReference" label="Deposit Reference">
                                <Input />
                            </Form.Item>
                            <Form.Item name="bankName" label="Bank Name">
                                <Input />
                            </Form.Item>
                            <Form.Item name="depositorName" label="Depositor Name">
                                <Input />
                            </Form.Item>
                        </>
                    )}

                    <Form.Item name="notes" label="Notes">
                        <Input.TextArea rows={4} />
                    </Form.Item>
                </Form>
            )}
        </Drawer>
    );
}
