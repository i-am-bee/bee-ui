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
    key: 'meeting-transcript-summarizer',
    name: 'Meeting Transcript Summarizer',
    description: 'Summarize meeting transcripts',
    uiMetadata: {
      icon: 'UserMultiple',
    },
    source_code: `# This app's purpose is to summarize meeting transcripts from uploaded DOCX or VTT files into 7 main takeaways.
# An LLM function is used to process the transcript and extract key points.

import streamlit as st
import docx
import json

@st.llm_function(creative=False)
async def summarize_transcript(transcript_text: str) -> list[str]:
    """Summarize the meeting transcript into 7 main takeaways. Focus on key decisions, action items, and important discussions."""

async def main():
    st.title("Meeting Transcript Summarizer", "Extract key takeaways from meeting transcripts")

    uploaded_file = st.file_uploader("Upload a meeting transcript file", type=["docx", "vtt"], key="file_uploader")
    submitted = st.button("Summarize transcript")

    if submitted:
        if not uploaded_file:
            st.error("Please upload a file to summarize.")
        else:
            if uploaded_file.type == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
                doc = docx.Document(uploaded_file)
                transcript_text = "".join([para.text for para in doc.paragraphs])
            elif uploaded_file.type == "text/vtt":
                vtt_data = uploaded_file.read().decode("utf-8")
                transcript_text = ""
                for line in vtt_data.splitlines():
                    if "-->" not in line and line.strip():
                        transcript_text += line.strip() + " "
            result = await summarize_transcript(transcript_text)
            st.divider()
            st.header("Main Takeaways")
            for i, takeaway in enumerate(result, start=1):
                st.write(f"{i}. {takeaway}")`,
  },
  {
    key: 'presentation-outline-generator',
    name: 'Presentation Outline Generator',
    description:
      'Generate a presentation outline based on a topic, tone, and desired length',
    uiMetadata: {
      icon: 'GroupPresentation',
    },
    source_code: `# The purpose of this app is to generate a presentation outline based on a topic, tone, and desired length. An LLM function is used to create the outline, considering the specified parameters.
import streamlit as st
@st.llm_function(creative=True)
async def generate_presentation_outline(topic: str, audience: str, length: int) -> str:
    """Create a presentation outline on the given topic for the specified audience and length. Structure the outline to be clear, concise, and engaging. Use standard outline formatting with headings and subheadings."""
async def main():
    st.title("Presentation Outline Generator", "Create a presentation outline on a given topic")
    topic = st.text_area("Presentation details", placeholder="Describe the topic and any key points to cover.", height=150)
    audience = st.selectbox("Presentation audience", ["General audience", "Industry experts", "Business leaders"])
    length = st.slider("Number of slides", min_value=5, max_value=20, value=10)
    submitted = st.button("Generate outline")
    if submitted:
        if not topic:
            st.error("Please enter the presentation details.")
        else:
            result = await generate_presentation_outline(topic, audience, length)
            st.divider()
            st.header("Presentation Outline")
            # Since we expect the user to copy and paste the generated outline, we use code formatting for it
            st.code(result, language=None, wrap_lines=True)`,
  },
  {
    key: 'github-repository-stats',
    name: 'GitHub Repository Stats',
    description: `Get insights into your repository's activity and engagement`,
    uiMetadata: {
      icon: 'ChartLineSmooth',
    },
    source_code: `import streamlit as st
import requests
import pandas as pd
from typing import Dict
from collections import defaultdict
from datetime import datetime
import pytz
import matplotlib.pyplot as plt
import seaborn as sns

# Function to fetch data from GitHub API
def fetch_github_data(repo_url: str) -> Dict:
    repo_url = repo_url.replace("https://github.com/", "")
    api_url = f"https://api.github.com/repos/{repo_url}"
    response = requests.get(api_url)
    return response.json() if response.status_code == 200 else None

# Function to fetch star count history from GitHub API
def get_stargazers_by_day(owner: str, repo: str) -> Dict[str, int]:
    """
    Fetches and returns the number of stargazers grouped by day in EST, sorted by most recent to least recent.

    Parameters:
    - owner (str): The username or organization name of the repository owner.
    - repo (str): The name of the repository.

    Returns:
    - Dict[str, int]: A dictionary where keys are dates ('YYYY-MM-DD' format) and values are the count of stargazers on that day.
    """
    url = f"https://api.github.com/repos/{owner}/{repo}/events"
    headers = {"Accept": "application/vnd.github.v3+json"}

    stargazers_by_day = defaultdict(int)
    page = 1
    est = pytz.timezone('US/Eastern')

    while True:
        response = requests.get(url, params={"page": page, "per_page": 100}, headers=headers)
        if response.status_code != 200:
            print(f"Error: Unable to fetch events (Status Code: {response.status_code})")
            break

        events = response.json()
        if not events:
            break

        for event in events:
            if event.get("type") == "WatchEvent":
                starred_at = event.get("created_at")
                if starred_at:
                    starred_datetime = datetime.strptime(starred_at, "%Y-%m-%dT%H:%M:%S%z")
                    starred_datetime_est = starred_datetime.astimezone(est)
                    starred_date = starred_datetime_est.date()
                    stargazers_by_day[str(starred_date)] += 1
        page += 1

    return dict(sorted(stargazers_by_day.items(), key=lambda x: x[0], reverse=True))

# Function to fetch watchers count from GitHub API
def get_watchers_count(owner: str, repo: str) -> int:
    url = f"https://api.github.com/repos/{owner}/{repo}/subscribers"
    response = requests.get(url)
    if response.status_code == 200:
        return len(response.json())
    else:
        print(f"Error: Unable to fetch watchers count (Status Code: {response.status_code})")
        return 0

# Function to fetch issues count using GitHub Search API
def get_issues(owner: str, repo: str, state: str) -> int:
    url = f"https://api.github.com/search/issues"
    params = {
        "q": f"repo:{owner}/{repo} is:issue state:{state}"
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        return response.json().get("total_count", 0)
    else:
        print(f"Error: Unable to fetch {state} issues (Status Code: {response.status_code})")
        return 0

# Function to fetch pull requests using GitHub Search API
def get_pull_requests(owner: str, repo: str, state: str) -> int:
    url = f"https://api.github.com/search/issues"
    params = {
        "q": f"repo:{owner}/{repo} is:pr state:{state}"
    }
    response = requests.get(url, params=params)
    if response.status_code == 200:
        return response.json().get("total_count", 0)
    else:
        print(f"Error: Unable to fetch {state} pull requests (Status Code: {response.status_code})")
        return 0

# Function to fetch contributors from GitHub API
def get_contributors(owner: str, repo: str) -> Dict[str, int]:
    url = f"https://api.github.com/repos/{owner}/{repo}/contributors"
    response = requests.get(url)
    if response.status_code == 200:
        contributors = response.json()
        contributors_dict = {}
        for contributor in contributors:
            contributors_dict[contributor['login']] = contributor['contributions']
        return dict(sorted(contributors_dict.items(), key=lambda x: x[1], reverse=True))
    else:
        print(f"Error: Unable to fetch contributors (Status Code: {response.status_code})")
        return {}

# Main app
async def main():
    st.title("GitHub Repository Stats", "Get insights into your repository's activity and engagement")

    repo_url = st.text_input("Enter the repository URL")

    st.markdown("<p>&nbsp;</p>", unsafe_allow_html=True)

    if st.button("Get Stats"):
        st.divider()
        with st.spinner("Fetching data from GitHub..."):
            repo_url = repo_url.replace("https://github.com/", "")
            parts = repo_url.split("/")
            if len(parts) != 2:
                st.error("Invalid repository URL")
                return
            owner, repo = parts
            data = fetch_github_data(repo_url)

            if data:
                watchers_count = get_watchers_count(owner, repo)
                open_issues = get_issues(owner, repo, 'open')
                closed_issues = get_issues(owner, repo, 'closed')
                open_pull_requests = get_pull_requests(owner, repo, 'open')
                closed_pull_requests = get_pull_requests(owner, repo, 'closed')
                
                # Repository Info
                col1, col2, col3 = st.columns([1, 1, 1])
                col1.metric(label="Stars", value=data['stargazers_count'])
                col2.metric(label="Forks", value=data['forks_count'])
                col3.metric(label="Watchers", value=watchers_count)

                st.markdown("<p>&nbsp;</p>", unsafe_allow_html=True)
                col1, col2, col3 = st.columns([1, 1, 1])
                col1.metric(label="Open Issues", value=open_issues)
                col2.metric(label="Closed Issues", value=closed_issues)
                col3.metric(label="Pull Requests", value=open_pull_requests + closed_pull_requests)

                stargazers_by_day = get_stargazers_by_day(owner, repo)
                if stargazers_by_day:
                    stargazers_df = pd.DataFrame(list(stargazers_by_day.items()), columns=["Date", "Stars"])
                    
                    # Add a line chart of new stars over time
                    st.divider()
                    st.header("New Stars Over Time")
                    st.line_chart(stargazers_df, x="Date", y="Stars")

                contributors = get_contributors(owner, repo)
                if contributors:
                    contributors_df = pd.DataFrame(list(contributors.items()), columns=["Contributor", "Contributions"])
                    contributors_df = contributors_df.nlargest(10, "Contributions")
                    
                    # Add a bar chart of top contributors
                    st.divider()
                    st.header("Top Contributors")
                    fig, ax = plt.subplots(figsize=(10, 6)) # Set the figure size
                    sns.set_style("whitegrid") # Set the style
                    sns.barplot(x="Contributor", y="Contributions", data=contributors_df, palette="Blues_d") # Set the color palette
                    ax.set_xticklabels(contributors_df['Contributor'], rotation=90) # Set the x-axis labels
                    ax.tick_params(axis='x', labelsize=8) # Set the font size of the x-axis labels
                    ax.set_xlabel("Contributor") # Set the x-axis label
                    ax.set_ylabel("Contributions") # Set the y-axis label
                    ax.set_title("Top Contributors") # Set the title
                    for i, v in enumerate(contributors_df['Contributions']):
                        ax.text(i, v + 3, str(v), color='black', ha='center') # Add labels to each bar
                    st.pyplot(fig)

            else:
                st.error("Failed to fetch data from GitHub")

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())`,
  },
];
