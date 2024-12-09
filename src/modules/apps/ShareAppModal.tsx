import { Organization } from '@/app/api/organization/types';
import { Project } from '@/app/api/projects/types';
import { Modal } from '@/components/Modal/Modal';
import { ModalProps } from '@/layout/providers/ModalProvider';
import { ModalBody, ModalHeader } from '@carbon/react';
import { ShareApp } from './ShareApp';
import { Artifact } from './types';

interface Props extends ModalProps {
  artifact: Artifact;
  project: Project;
  organization: Organization;
  onSuccess?: (artifact: Artifact) => void;
}

export function ShareAppModal({
  artifact,
  project,
  organization,
  onSuccess,
  ...props
}: Props) {
  return (
    <Modal {...props} preventCloseOnClickOutside>
      <ModalHeader>
        <h2>Share</h2>
      </ModalHeader>

      <ModalBody>
        <ShareApp
          artifact={artifact}
          project={project}
          organization={organization}
          onSuccess={onSuccess}
        />
      </ModalBody>
    </Modal>
  );
}
