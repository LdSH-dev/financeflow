import { useUIStore } from '@stores/ui'

export interface ConfirmationOptions {
  title: string
  message: string
  type?: 'warning' | 'danger' | 'info'
  confirmText?: string
  cancelText?: string
  onConfirm?: () => Promise<void> | void
  onCancel?: () => Promise<void> | void
}

export function useConfirmation() {
  const uiStore = useUIStore()

  const confirm = async (options: ConfirmationOptions): Promise<boolean> => {
    return uiStore.showConfirmation({
      title: options.title,
      message: options.message,
      type: options.type || 'warning',
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      onConfirm: options.onConfirm,
      onCancel: options.onCancel
    })
  }

  const confirmDelete = async (itemName: string, onConfirm?: () => Promise<void> | void): Promise<boolean> => {
    return confirm({
      title: 'Delete Confirmation',
      message: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      onConfirm
    })
  }

  const confirmDiscard = async (onConfirm?: () => Promise<void> | void): Promise<boolean> => {
    return confirm({
      title: 'Discard Changes',
      message: 'You have unsaved changes. Are you sure you want to discard them?',
      type: 'warning',
      confirmText: 'Discard',
      cancelText: 'Keep Editing',
      onConfirm
    })
  }

  const confirmAction = async (
    actionName: string,
    description: string,
    onConfirm?: () => Promise<void> | void
  ): Promise<boolean> => {
    return confirm({
      title: `${actionName} Confirmation`,
      message: description,
      type: 'info',
      confirmText: actionName,
      cancelText: 'Cancel',
      onConfirm
    })
  }

  const handleConfirmation = (result: boolean): void => {
    const modal = uiStore.confirmationModal
    if (result && modal.onConfirm) {
      modal.onConfirm()
    } else if (!result && modal.onCancel) {
      modal.onCancel()
    } else {
      uiStore.hideConfirmation()
    }
  }

  return {
    confirm,
    confirmDelete,
    confirmDiscard,
    confirmAction,
    handleConfirmation
  }
}