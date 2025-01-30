import { CardsListItem } from '@/components/CardsList/CardsListItem';
import { useModal } from '@/layout/providers/ModalProvider';
import { useRoutes } from '@/routes/useRoutes';
import { MouseEventHandler } from 'react';
import { useDeleteArtifact } from '../api/mutations/useDeleteArtifact';
import { AppIcon } from '../AppIcon';
import { ShareAppModal } from '../ShareAppModal';
import { Artifact } from '../types';
import classes from './AppCard.module.scss';

interface Props {
  artifact: Artifact;
  cta?: string;
  onClick?: MouseEventHandler;
}

export function AppCard({ artifact, cta, onClick }: Props) {
  const { name, description } = artifact;
  const { routes, navigate } = useRoutes();
  const { openModal } = useModal();

  const {
    mutateAsyncWithConfirmation: deleteArtifact,
    isPending: isDeletePending,
  } = useDeleteArtifact();

  return (
    <>
      <CardsListItem
        className={classes.root}
        title={name ?? ''}
        icon={<AppIcon name={artifact.uiMetadata.icon} />}
        onClick={onClick}
        isDeletePending={isDeletePending}
        cta={cta ? { title: cta } : undefined}
        actions={[
          {
            itemText: 'Edit',
            onClick: () =>
              navigate(routes.artifactBuilder({ artifactId: artifact.id })),
          },
          {
            itemText: 'Share',
            onClick: () =>
              openModal((props) => (
                <ShareAppModal {...props} artifact={artifact} />
              )),
          },
          {
            itemText: 'Copy to edit',
            onClick: () =>
              navigate(
                routes.artifactBuilder({
                  artifactId: artifact.id,
                  clone: true,
                }),
              ),
          },
          {
            isDelete: true,
            itemText: 'Delete',
            onClick: () => deleteArtifact(artifact),
          },
        ]}
      >
        {description && (
          <div className={classes.body}>
            <p>{description}</p>
          </div>
        )}
      </CardsListItem>
    </>
  );
}

AppCard.Skeleton = function Skeleton() {
  return <CardsListItem.Skeleton className={classes.root} />;
};
