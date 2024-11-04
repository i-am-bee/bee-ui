import { Modal } from '@/components/Modal/Modal';
import { ModalProps } from '@/layout/providers/ModalProvider';
import { Button, ModalBody, ModalFooter, ModalHeader } from '@carbon/react';
import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { assistantsQuery, lastAssistantsQuery } from '../library/queries';
import { Assistant } from '../types';
import classes from './AssistantModal.module.scss';
import { useDeleteAssistant } from '../builder/useDeleteAssistant';
import { AssistantIcon } from '../icons/AssistantIcon';
import { Edit } from '@carbon/react/icons';
import { useAppContext } from '@/layout/providers/AppProvider';
import { LineClampText } from '@/components/LineClampText/LineClampText';
import { useMemo } from 'react';
import {
  getAssistantToolReference,
  getToolIcon,
  getToolName,
} from '@/modules/tools/utils';

export interface AssistantModalProps {
  onDeleteSuccess?: () => void;
  assistant: Assistant;
}

export default function AssistantModal({
  assistant,
  onDeleteSuccess,
  ...props
}: AssistantModalProps & ModalProps) {
  const { project, isProjectReadOnly } = useAppContext();
  const queryClient = useQueryClient();
  const { deleteAssistant, isPending: isDeletePending } = useDeleteAssistant({
    assistant: assistant!,
    onSuccess: async () => {
      onDeleteSuccess?.();

      // invalidate all queries on GET:/assistants
      queryClient.invalidateQueries({
        queryKey: [assistantsQuery(project.id).queryKey.at(0)],
      });
      queryClient.invalidateQueries({
        queryKey: lastAssistantsQuery(project.id).queryKey,
      });
    },
  });

  const tools = useMemo(
    () =>
      assistant.tools.map((item) => {
        const toolReference = getAssistantToolReference(item);
        return {
          icon: getToolIcon(toolReference),
          name: getToolName(toolReference),
        };
      }),
    [assistant.tools],
  );

  console.log({ assistant });

  return (
    <Modal
      {...props}
      size="md"
      className={classes.modal}
      rootClassName={classes.root}
    >
      <ModalHeader />
      <ModalBody>
        <div
          className={clsx(classes.content, {
            [classes.isDeletePending]: isDeletePending,
          })}
        >
          <div className={classes.head}>
            <AssistantIcon assistant={assistant} size="lg" />
            <h2>{assistant.name}</h2>
            <p>{assistant.description}</p>
          </div>
          <dl className={classes.body}>
            {assistant.instructions && (
              <div>
                <dd>Role</dd>
                <dt>
                  <LineClampText numberOfLines={4}>
                    {assistant.instructions}
                  </LineClampText>
                </dt>
              </div>
            )}

            <div>
              <dd>Tools</dd>
              <dt>
                <ul>
                  {tools.map(({ icon: Icon, name }, index) => (
                    <li key={index}>
                      <Icon /> {name}
                    </li>
                  ))}
                </ul>
              </dt>
            </div>
          </dl>
        </div>
      </ModalBody>
      <ModalFooter className={classes.actionBar}>
        <div>
          {assistant && (
            <Button kind="danger--ghost" onClick={deleteAssistant}>
              Delete bee
            </Button>
          )}
        </div>
        <div>
          <Button kind="ghost" onClick={() => props.onRequestClose()}>
            Cancel
          </Button>
          <Button
            kind="secondary"
            onClick={() => props.onRequestClose()}
            renderIcon={Edit}
          >
            Edit
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
