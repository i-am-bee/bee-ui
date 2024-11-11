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

// import {
//   HUMAN_ALLOWED_EXTENSIONS_EXTRACTION,
//   HUMAN_ALLOWED_EXTENSIONS_TEXT,
//   HUMAN_MAX_SIZE,
// } from '@/modules/knowledge/files/KnowledgeFilesUpload';
import { IconButton, OverflowMenu, OverflowMenuItem } from '@carbon/react';
import { Attachment } from '@carbon/react/icons';
import { MouseEventHandler } from 'react';
// import classes from './FilesMenu.module.scss';

interface Props {
  onUploadClick: MouseEventHandler<HTMLElement>;
}

export function FilesMenu({ onUploadClick }: Props) {
  return (
    <IconButton
      label="Upload file"
      onClick={onUploadClick}
      autoAlign
      kind="ghost"
      size="sm"
    >
      <Attachment />
    </IconButton>
  );
  // TEMP: hide the menu, until the correct description is resolved
  // return (
  //   <OverflowMenu
  //     iconDescription="Files"
  //     renderIcon={Attachment}
  //     direction="top"
  //     menuOptionsClass={classes.root}
  //     size="sm"
  //   >
  //     <OverflowMenuItem
  //       wrapperClassName={classes.item}
  //       itemText={
  //         <span className={classes.itemContent}>
  //           <strong>Upload file</strong>
  //           <span>
  //             Max file size : {HUMAN_MAX_SIZE}.<br />
  //             Supported formats: {HUMAN_ALLOWED_EXTENSIONS_TEXT}, and text-based
  //             images ({HUMAN_ALLOWED_EXTENSIONS_EXTRACTION}).
  //           </span>
  //         </span>
  //       }
  //       onClick={onUploadClick}
  //     />
  //   </OverflowMenu>
  // );
}
