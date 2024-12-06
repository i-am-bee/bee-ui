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

import { FormItem, FileUploaderDropContainer, usePrefix } from '@carbon/react';
import { SyntheticEvent, useCallback, useId, useMemo } from 'react';
import { Control, FieldValues, Path, useController } from 'react-hook-form';
import { v4 as uuid } from 'uuid';
import classes from './UploadDataset.module.scss';
import { FilePurpose, FileEntity } from '@/app/api/files/types';
import { createFile } from '@/app/api/files';
import { CloudUpload } from '@carbon/react/icons';
import mimeType from 'mime-types';
import { useAppContext } from '@/layout/providers/AppProvider';

interface Props<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>,
> {
  control: Control<TFieldValues>;
  name: TName;
  accept?: string[];
  multiple?: boolean;
  disabled?: boolean;
  title?: string | null;
  description?: string | null;
  labelText?: string;
  onAddFiles?: (files: UploadFileValue[]) => void;
}

type UploadOptions = {
  purpose: FilePurpose;
};

export interface UploadFileValue {
  id: string;
  file: File;
  invalid: boolean;
  upload: (options: UploadOptions) => Promise<FileEntity | undefined>;
  registerStateChangeListener: (
    listener: (state: UploadFileState) => void,
  ) => void;
  getState: () => UploadFileState;
  getUploadedFile: () => FileEntity | undefined;
}

export interface UploadFileState {
  status: 'edit' | 'uploading' | 'complete';
  invalid?: boolean;
  errorSubject?: string;
  errorBody?: string;
}

// Max file size in bytes
const MAX_SIZE = 100 * 1024 * 1024;
// MAX_SIZE representation for humans
const HUMAN_MAX_SIZE = '100 MiB';

export function UploadDataset<
  TFieldValues extends FieldValues = FieldValues,
  TName extends Path<TFieldValues> = Path<TFieldValues>,
>({
  control,
  name,
  accept = [],
  multiple = true,
  disabled,
  title = 'Upload files',
  description,
  labelText,
  onAddFiles,
}: Props<TFieldValues, TName>) {
  const prefix = usePrefix();
  const id = useId();
  const { project, organization } = useAppContext();

  const { field } = useController({ control, name });

  const extensionsString = accept.join(', ');

  const createUploadFile = useCallback(
    (file: File) => {
      let invalid = false;
      let state: UploadFileState = {
        status: 'edit',
      };
      let uploadedFile: FileEntity | undefined;
      const listeners: Array<(state: UploadFileState) => void> = [];

      const setState = (newState: UploadFileState) => {
        state = newState;
        listeners.forEach((listener) => listener(newState));
      };

      if (file.size > MAX_SIZE) {
        state = {
          status: 'edit',
          invalid: true,
          errorSubject: 'File size exceeds limit',
          errorBody: `${HUMAN_MAX_SIZE} max file size.`,
        };
        invalid = true;
      }

      // @ts-expect-error invalidFileType is added to the File by FileUploaderDropContainer
      if (file.invalidFileType) {
        state = {
          status: 'edit',
          invalid: true,
          errorSubject: 'Invalid file type',
          errorBody: `Only ${extensionsString} files are allowed.`,
        };
        invalid = true;
      }

      return {
        id: uuid(),
        file,
        invalid,
        upload: (() => {
          let promise: Promise<FileEntity | undefined> | null = null;
          return ({ purpose }: UploadOptions) => {
            if (promise == null) {
              setState({ status: 'uploading' });
              promise = createFile(organization.id, project.id, {
                file,
                purpose,
              }).then(
                (result) => {
                  uploadedFile = result;
                  setState({ status: 'complete' });
                  return result;
                },
                (err: Error) => {
                  setState({
                    status: 'edit',
                    invalid: true,
                    errorSubject: 'Upload failed',
                    errorBody: err.message,
                  });
                  promise = null;
                  throw err;
                },
              );
            }
            return promise;
          };
        })(),
        registerStateChangeListener: (
          listener: (state: UploadFileState) => void,
        ) => {
          listeners.push(listener);
          return () => {
            const index = listeners.indexOf(listener);
            if (index >= 0) {
              listeners.splice(index, 1);
            }
          };
        },
        getUploadedFile: () => uploadedFile,
        getState: () => state,
      };
    },
    [extensionsString, project.id, organization.id],
  );

  const handleAddFiles = (
    _e: SyntheticEvent<HTMLElement, Event>,
    { addedFiles }: { addedFiles: File[] },
  ) => {
    const addedFilesUpload = addedFiles.map(createUploadFile);

    if (multiple) {
      onAddFiles?.(addedFilesUpload);
      const newValue = [...field.value, ...addedFilesUpload];
      field.onChange(newValue);
    } else {
      const singleFile = addedFilesUpload.at(0);
      if (singleFile) {
        onAddFiles?.([singleFile]);
        field.onChange(addedFilesUpload);
      }
    }
  };

  const mimeTypes = useMemo(
    () => accept.map((ext) => String(mimeType.lookup(ext))),
    [accept],
  );

  return (
    <FormItem className={classes.root}>
      <label className={`${prefix}--label`}>{title}</label>
      <div className={classes.placeholder}>
        <CloudUpload className={classes.uploadIcon} size={32} />
        <p>
          Drag & drop or <a role="button">attach files</a>
        </p>
        {description !== null && (
          <p className={classes.description}>
            {description ??
              `Max file size is ${HUMAN_MAX_SIZE}. Supported file type is
        ${extensionsString}.`}
          </p>
        )}

        <FileUploaderDropContainer
          id={id}
          name={field.name}
          innerRef={field.ref}
          accept={mimeTypes}
          labelText={
            labelText ??
            `Drag and drop file${multiple ? 's' : ''} here or click to upload`
          }
          multiple={multiple}
          onAddFiles={handleAddFiles}
          disabled={disabled}
        />
      </div>
    </FormItem>
  );
}
