import { useEffect } from 'react';
import { useModalControl } from '../providers/ModalControlProvider';

export function useConfirmModalCloseOnDirty(
  isDirty: boolean,
  entityName?: string,
) {
  const { setConfirmOnRequestClose, clearConfirmOnRequestClose } =
    useModalControl();

  useEffect(() => {
    if (isDirty)
      setConfirmOnRequestClose(
        `Your ${entityName ?? 'form'} has unsaved changes, do you really want to leave?`,
      );
    else clearConfirmOnRequestClose();
    return () => clearConfirmOnRequestClose();
  }, [
    clearConfirmOnRequestClose,
    isDirty,
    entityName,
    setConfirmOnRequestClose,
  ]);
}
