/**
 * Copyright 2024 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Download } from '@carbon/react/icons';
import { Attachment, AttachmentProps } from '../../attachments/Attachment';
import classes from './AttachmentLink.module.scss';
import { useAppContext } from '@/layout/providers/AppProvider';

export function AttachmentLink({
  fileId,
  filename,
  title,
  size,
}: {
  fileId: string;
  filename: string;
  title?: string;
  size?: AttachmentProps['size'];
}) {
  const { project, organization } = useAppContext();

  const params = new URLSearchParams({
    project: project.id,
    organization: organization.id,
  });

  return (
    <Attachment size={size} startIcon={null} endIcon={Download}>
      <a
        className={classes.link}
        download={filename}
        href={`/api/v1/files/${fileId}/content?${params.toString()}`}
        data-disable-nprogress
      >
        {title || filename}
      </a>
    </Attachment>
  );
}
