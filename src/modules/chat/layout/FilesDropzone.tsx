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

import { HUMAN_MAX_SIZE } from '@/modules/knowledge/files/KnowledgeFilesUpload';
import { CloudUpload } from '@carbon/react/icons';
import classes from './FilesDropzone.module.scss';

export function FilesDropzone() {
  return (
    <div className={classes.root}>
      <div className={classes.content}>
        <span className={classes.icon}>
          <CloudUpload size={96} />
        </span>

        <h2 className={classes.heading}>Drag & Drop</h2>
        <p className={classes.description}>
          Max file size: {HUMAN_MAX_SIZE}.
          {/* TEMP: hide until the correct description is resolved
          <br />
          Supported formats: {HUMAN_ALLOWED_EXTENSIONS_TEXT}, and text-based
          images ({HUMAN_ALLOWED_EXTENSIONS_EXTRACTION}). */}
        </p>
      </div>
    </div>
  );
}
