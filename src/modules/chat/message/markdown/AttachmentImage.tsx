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

import { useQuery } from '@tanstack/react-query';
import classes from './AttachmentImage.module.scss';
import { Spinner } from '@/components/Spinner/Spinner';
import { readFileContent } from '@/app/api/files';
import { useAppContext } from '@/layout/providers/AppProvider';

export function AttachmentImage({
  fileId,
  alt,
  title,
}: {
  fileId: string;
  alt: string;
  title?: string;
}) {
  const { project, organization } = useAppContext();
  const { data: content, isLoading } = useQuery({
    queryKey: ['files/{file_id}/content', project.id, fileId],
    queryFn: () => readFileContent(organization.id, project.id, fileId),
  });

  return (
    <span className={classes.root}>
      {isLoading ? (
        <>
          Loading image <Spinner />
        </>
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={content ?? ''} alt={title || alt} />
        </>
      )}
    </span>
  );
}
