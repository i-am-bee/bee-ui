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

import { useToast } from '@/layout/providers/ToastProvider';
import { FileUploaderItem } from '@carbon/react';
import { CloudUpload } from '@carbon/react/icons';
import clsx from 'clsx';
import {
  Dispatch,
  SetStateAction,
  SyntheticEvent,
  useCallback,
  useMemo,
} from 'react';
import { ErrorCode, FileRejection, useDropzone } from 'react-dropzone';
import { v4 as uuid } from 'uuid';
import classes from './KnowledgeFilesUpload.module.scss';
import { VectoreStoreFileUpload } from './VectorStoreFilesUploadProvider';
import {
  getAllowedMimeTypes,
  HUMAN_ALLOWED_EXTENSIONS_EXTRACTION,
  HUMAN_ALLOWED_EXTENSIONS_TEXT_EXAMPLE,
} from '@/modules/files/utils';
import { useAppContext } from '@/layout/providers/AppProvider';

interface Props {
  files: VectoreStoreFileUpload[];
  onSetFiles: Dispatch<SetStateAction<VectoreStoreFileUpload[]>>;
  disabled?: boolean;
}

export function KnowledgeFilesUpload({ files, disabled, onSetFiles }: Props) {
  const { addToast } = useToast();
  const { featureFlags } = useAppContext();

  const onDropAccepted = useCallback(
    async (acceptedFiles: File[]) => {
      const newFiles = acceptedFiles.map((file) => ({
        id: uuid(),
        originalFile: file,
        status: 'new' as const,
        isReadable: true,
      }));

      onSetFiles((files) => [...files, ...newFiles]);
    },
    [onSetFiles],
  );

  const onDropRejected = useCallback(
    (rejections: FileRejection[]) => {
      rejections.forEach(({ errors, file }) => {
        addToast({
          title: `File '${file.name}' was rejected`,
          subtitle: errors.map(({ message }) => message).join('\n'),
          timeout: 5_000,
        });
      });
    },
    [addToast],
  );

  const allowedMimeTypes = useMemo(
    () =>
      getAllowedMimeTypes(featureFlags.TextExtraction).reduce(
        (result: { [key: string]: [] }, type) => {
          result[type] = [];
          return result;
        },
        {},
      ),
    [featureFlags.TextExtraction],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDropAccepted,
    onDropRejected,
    accept: allowedMimeTypes,
    validator: (file) => {
      if (file.size > MAX_SIZE)
        return { message: 'File is too big.', code: ErrorCode.FileTooLarge };
      return null;
    },
  });

  return (
    <div className={classes.root}>
      <label className={classes.label}>Documents</label>
      <div
        className={clsx(classes.dropzone, {
          [classes.dragging]: isDragActive,
          [classes.disabled]: disabled,
        })}
        {...getRootProps()}
      >
        <div className={classes.content}>
          <span className={classes.icon}>
            <CloudUpload size={32} />
          </span>

          <p>
            Drag & drop or <a role="button">attach files</a>
          </p>

          <input type="file" {...getInputProps()} />

          <p className={classes.description}>
            Supports files up to {HUMAN_MAX_SIZE}. Accepted formats: plain text
            ({HUMAN_ALLOWED_EXTENSIONS_TEXT_EXAMPLE}, ...)
            {featureFlags.TextExtraction
              ? ` and other files containing text (
            ${HUMAN_ALLOWED_EXTENSIONS_EXTRACTION})`
              : ''}
            .
          </p>
        </div>
      </div>

      <div className={classes.files}>
        {files.map((file) => (
          <UploadFileItem
            key={file.id}
            value={file}
            onDelete={() => {
              onSetFiles((files) =>
                files.filter((item) => file.id !== item.id),
              );
            }}
          />
        ))}
      </div>
    </div>
  );
}

// MAX_SIZE representation for humans
export const HUMAN_MAX_SIZE = '100 MiB';
const MAX_SIZE = 100 * 1024 * 1024;

interface UploadFileItemProps {
  value: VectoreStoreFileUpload;
  onDelete: (fileId: string) => void;
}

function UploadFileItem({ value, onDelete }: UploadFileItemProps) {
  const { id, status, originalFile } = value;
  const isPending = status === 'embedding' || status === 'uploading';

  let iconDescription = 'Remove file';
  if (value.status === 'uploading') {
    iconDescription = 'Uploading...';
  } else if (status === 'embedding') {
    iconDescription = 'Embedding...';
  } else if (status === 'complete') {
    iconDescription = 'Completed';
  }

  return (
    <FileUploaderItem
      name={originalFile.name}
      uuid={id}
      iconDescription={iconDescription}
      status={
        isPending ? 'uploading' : status === 'complete' ? 'complete' : 'edit'
      }
      onDelete={(
        _e: SyntheticEvent<HTMLElement, Event>,
        { uuid }: { uuid: string },
      ) => {
        onDelete(uuid);
      }}
    />
  );
}
