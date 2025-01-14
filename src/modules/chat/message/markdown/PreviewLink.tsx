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

import { Spinner } from '@/components/BouncingDots/Spinner';
import { Tooltip } from '@/components/Tooltip/Tooltip';
import { SkeletonIcon } from '@carbon/react';
import { Launch } from '@carbon/react/icons';
import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { Link } from 'mdast';
import { AnchorHTMLAttributes, useState } from 'react';
import { linkPreviewQuery } from '../../queries';
import classes from './PreviewLink.module.scss';

interface Props extends AnchorHTMLAttributes<HTMLAnchorElement> {
  node?: Link;
}

export function PreviewLink({ node, className, ...props }: Props) {
  const [enableFetch, setEnableFetch] = useState(false);
  const [imageError, setImageError] = useState(false);
  const url = props.href || '';

  const onImageError = () => {
    setImageError(true);
  };

  const { data, isLoading } = useQuery({
    ...linkPreviewQuery(url),
    enabled: enableFetch,
  });

  return (
    <Tooltip
      placement="top"
      content={
        isLoading ? (
          <>
            Loading link preview <Spinner />
          </>
        ) : data && 'error' in data ? (
          data.error
        ) : (
          <div className={classes.root}>
            <span
              className={clsx(classes.image, {
                [classes.error]: imageError,
              })}
            >
              {isLoading ? (
                <SkeletonIcon />
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data?.icon}
                    width={24}
                    height={24}
                    alt=""
                    onError={onImageError}
                  />
                </>
              )}
            </span>

            <p className={classes.body}>
              <strong className={classes.title}>
                <span>{data?.title || url}</span>

                <Launch />
              </strong>

              <span className={classes.url}>{url}</span>
            </p>
          </div>
        )
      }
      asChild
    >
      <a
        {...props}
        target="_blank"
        rel="noopener noreferrer"
        className={clsx(classes.link, className)}
        onMouseEnter={() => {
          setEnableFetch(true);
        }}
      />
    </Tooltip>
  );
}
