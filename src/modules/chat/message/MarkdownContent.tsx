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

import { memo, ReactElement } from 'react';
import Markdown, { Components } from 'react-markdown';
import rehypeMinifyWhitespace from 'rehype-minify-whitespace';
import remarkGfm from 'remark-gfm';
import { PluggableList } from 'unified';
import { rehypeAnnotateInlineCode } from './markdown-plugins/rehypeAnnotateInlineCode';
import { rehypeCarbonLists } from './markdown-plugins/rehypeCarbonLists';
import { remarkAttachmentImage } from './markdown-plugins/remarkAttachmentImage';
import { remarkAttachmentLink } from './markdown-plugins/remarkAttachmentLink';
import { remarkPreviewLink } from './markdown-plugins/remarkPreviewLink';
import { AttachmentImage } from './markdown/AttachmentImage';
import { AttachmentLink } from './markdown/AttachmentLink';
import { Code } from './markdown/Code';
import { PreviewLink } from './markdown/PreviewLink';
import { Table } from './markdown/Table';
import { remarkPythonAppCode } from './markdown-plugins/remarkPythonAppCode';
import { PythonAppCode } from './markdown/PythonAppCode';

interface Props {
  content: string;
}

export const MarkdownContent = memo(function MarkdownContent({
  content,
}: Props) {
  return (
    <Markdown
      rehypePlugins={REHYPE_PLUGINS}
      remarkPlugins={REMARK_PLUGINS}
      components={COMPONENTS}
    >
      {content}
    </Markdown>
  );
});

const REHYPE_PLUGINS = [
  [rehypeMinifyWhitespace, { newlines: true }],
  rehypeAnnotateInlineCode,
  rehypeCarbonLists,
] satisfies PluggableList;

const REMARK_PLUGINS = [
  remarkAttachmentLink,
  remarkAttachmentImage,
  remarkPreviewLink,
  remarkPythonAppCode,
  remarkGfm,
] satisfies PluggableList;

interface ExtendedComponents extends Components {
  attachmentLink?: (props: any) => ReactElement;
  attachmentImage?: (props: any) => ReactElement;
  previewLink?: (props: any) => ReactElement;
  pythonAppCode?: (props: any) => ReactElement;
}

const COMPONENTS = {
  code: Code,
  table: Table,
  attachmentLink: AttachmentLink,
  attachmentImage: AttachmentImage,
  previewLink: PreviewLink,
  pythonAppCode: PythonAppCode,
} satisfies ExtendedComponents;
