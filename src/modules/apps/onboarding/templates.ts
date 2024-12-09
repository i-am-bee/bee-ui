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

import { AppTemplate } from '../types';

export const ARTIFACT_TEMPLATES: AppTemplate[] = [
  {
    key: 'blog-post-brainstormer',
    name: 'Blog post brainstormer',
    description: 'Generate innovative ideas for your next blog post',
    uiMetadata: {
      icon: 'DocumentSigned',
    },
    source_code: `import random
import streamlit as st
st.header("TODO: Add template code.")`,
  },
  {
    key: 'research-paper-summary',
    name: 'Research paper summary',
    description: 'Transform research papers PDFs into concise summaries',
    uiMetadata: {
      icon: 'Document',
    },
    source_code: `import random
import streamlit as st
st.header("TODO: Add template code.")`,
  },
  {
    key: 'data-dashboard',
    name: 'Data dashboard',
    description: 'Visualizes insights based on a CSV file (structured data)',
    uiMetadata: {
      icon: 'ChartLineSmooth',
    },
    source_code: `import random
import streamlit as st
st.header("TODO: Add template code.")`,
  },
];
