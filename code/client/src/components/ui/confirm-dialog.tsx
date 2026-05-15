import { Dialog } from "./dialog";
import { Button } from "./button";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = "Confirm",
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onClose={onCancel} title={title}>
            <p className="text-sm text-gray-700 mb-6">{message}</p>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button type="button" variant="destructive" onClick={onConfirm}>{confirmLabel}</Button>
            </div>
        </Dialog>
    );
}
