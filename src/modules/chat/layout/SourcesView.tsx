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

import { LinkPreview } from '@/app/api/types';
import { ExpandPanel } from '@/components/ExpandPanel/ExpandPanel';
import { ExpandPanelButton } from '@/components/ExpandPanelButton/ExpandPanelButton';
import { fadeProps } from '@/utils/fadeProps';
import { SkeletonIcon, SkeletonText } from '@carbon/react';
import { Add } from '@carbon/react/icons';
import { useQueries } from '@tanstack/react-query';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import { memo, useEffect, useId, useState } from 'react';
import { useLinkPreviewQueries } from '../../link-preview/queries';
import classes from './SourcesView.module.scss';

type Source = {
  url: string;
  filtered?: boolean;
};

interface Props {
  sources?: Source[];
  show?: boolean;
  enableFetch?: boolean;
}

export function SourcesView({ sources = [], show, enableFetch }: Props) {
  const id = useId();
  const triggerId = `${id}:trigger`;
  const panelId = `${id}:panel`;

  const [expanded, setExpanded] = useState(false);
  const [enableFetchAll, setEnableFetchAll] = useState(false);

  const linkPreviewQueries = useLinkPreviewQueries();

  const isFiltered = ({ filtered }: Source) => filtered;

  const queries = useQueries({
    queries: sources.map(({ url }) => ({
      ...linkPreviewQueries.detail(url),
      enabled: enableFetchAll,
    })),
  });

  const allSources = queries
    .map((query, index) => ({
      ...sources[index],
      ...query.data,
      isLoading: query.isLoading,
      refetch: query.refetch,
    }))
    .filter((item) => !('error' in item));
  const totalSources = allSources.length;

  const filteredSources = allSources.filter(isFiltered);
  const filteredTotalSources = filteredSources.length;

  const previewSources = filteredSources.slice(0, 5);

  const hasSources = filteredSources.length > 0;

  useEffect(() => {
    previewSources.forEach((source) => {
      if (enableFetch && !('icon' in source)) {
        source.refetch();
      }
    });
  }, [previewSources, enableFetch]);

  useEffect(() => {
    if (expanded) {
      setEnableFetchAll(true);
    }
  }, [expanded]);

  return hasSources ? (
    <AnimatePresence>
      {show && (
        <motion.section
          {...fadeProps()}
          className={clsx(classes.root, { [classes.expanded]: expanded })}
        >
          <header className={classes.header}>
            <ExpandPanelButton
              id={triggerId}
              panelId={panelId}
              expanded={expanded}
              onClick={() => {
                setExpanded((state) => !state);
              }}
              onMouseEnter={() => {
                setEnableFetchAll(true);
              }}
            />

            <h2 className={classes.heading}>
              {filteredTotalSources !== totalSources ? (
                <>
                  {filteredTotalSources} of {totalSources}
                </>
              ) : (
                totalSources
              )}{' '}
              Sources
            </h2>

            <ul className={classes.previewList}>
              {previewSources.map(({ ...props }) => (
                <Source key={props.url} {...props} iconOnly />
              ))}

              {filteredTotalSources > 5 && (
                <li className={classes.item}>
                  <Add />
                </li>
              )}
            </ul>
          </header>

          <ExpandPanel
            id={panelId}
            triggerId={triggerId}
            expanded={expanded}
            closeImmediately
            onFocus={() => {
              setExpanded(true);
            }}
          >
            <ul className={classes.list}>
              {filteredSources.map(({ ...props }) => (
                <Source key={props.url} {...props} />
              ))}
            </ul>
          </ExpandPanel>
        </motion.section>
      )}
    </AnimatePresence>
  ) : null;
}

const Source = memo(function Source({
  url,
  title,
  icon,
  isLoading,
  iconOnly,
}: Source &
  Partial<LinkPreview> & {
    isLoading?: boolean;
    iconOnly?: boolean;
  }) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const label = title || url;

  const onImageLoad = () => {
    setImageLoaded(true);
  };

  const onError = () => {
    setImageError(true);
  };

  return (
    <li
      className={clsx(classes.item, {
        [classes.iconOnly]: iconOnly,
        [classes.isLoading]: isLoading,
      })}
    >
      <span className={classes.icon}>
        {isLoading && !imageLoaded && <SkeletonIcon />}

        {!imageError && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={icon}
              width="16"
              height="16"
              alt=""
              onLoad={onImageLoad}
              onError={onError}
              className={clsx({ [classes.imageNotLoaded]: !imageLoaded })}
            />
          </>
        )}

        {!isLoading && imageError && (
          <span className={classes.iconFallback}>
            {label?.at(0)?.toUpperCase()}
          </span>
        )}
      </span>

      {!iconOnly && (
        <a
          href={url}
          className={classes.link}
          target="_blank"
          rel="noopener noreferrer"
        >
          {isLoading ? <SkeletonText lineCount={1} /> : label}
        </a>
      )}
    </li>
  );
});
