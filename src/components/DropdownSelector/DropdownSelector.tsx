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

import { fadeProps } from '@/utils/fadeProps';
import { noop } from '@/utils/helpers';
import { Button, Checkbox, Tag, TextInput } from '@carbon/react';
import { Checkmark, ChevronDown } from '@carbon/react/icons';
import {
  autoUpdate,
  flip,
  FloatingPortal,
  size,
  useClick,
  useDismiss,
  useFloating,
  useInteractions,
  useRole,
} from '@floating-ui/react';
import clsx from 'clsx';
import { AnimatePresence, motion } from 'framer-motion';
import has from 'lodash/has';
import {
  ReactElement,
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react';
import { mergeRefs } from 'react-merge-refs';
import { ClearButton } from '../ClearButton/ClearButton';
import classes from './DropdownSelector.module.scss';

type ItemWithId = { id: string };

interface Props<T extends ItemWithId> {
  placeholder?: string;
  multiple?: boolean;
  items: DropdownSelectorGroup<T>[] | T[];
  selected?: T | T[];
  submitButtonTitle?: string;
  actionBarContentLeft?: ReactElement;
  onSubmit: (value: T[] | null, clearSelected: () => void) => void;
  itemToString: (item: T) => string;
  itemToElement?: (item: T) => ReactElement;
}

export function DropdownSelector<T extends ItemWithId>({
  items,
  selected: controlledSelected,
  multiple,
  placeholder = 'Browse available items',
  submitButtonTitle = 'Submit',
  actionBarContentLeft = <div />,
  onSubmit,
  itemToString,
  itemToElement,
}: Props<T>) {
  const id = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState<string>('');
  const [selected, setSelected] = useState<T[]>(
    Array.isArray(controlledSelected)
      ? controlledSelected
      : controlledSelected
        ? [controlledSelected]
        : [],
  );
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleClear = useCallback(() => {
    onSubmit(null, noop);
    setSelected([]);
    setSearchValue('');
  }, [onSubmit]);

  const handleSubmit = useCallback(() => {
    onSubmit(selected, handleClear);
    setIsOpen(false);
  }, [handleClear, onSubmit, selected]);

  const handleToggle = useCallback(
    (item: T, toggled: boolean) => {
      setSelected((value) => {
        if (multiple) {
          return toggled
            ? [...value, item]
            : value.filter((selectedItem) => selectedItem !== item);
        } else {
          return [item];
        }
      });
    },
    [multiple],
  );

  const { refs, floatingStyles, context, placement } = useFloating({
    placement: 'bottom-start',
    open: isOpen,
    onOpenChange: (open) => setIsOpen(!controlledSelected ? open : false),
    whileElementsMounted: autoUpdate,
    middleware: [
      flip(),
      size({
        apply({ elements }) {
          const width = buttonRef.current?.offsetWidth;
          elements.floating.style.inlineSize = `${width}px`;
        },
      }),
    ],
  });

  const click = useClick(context);
  const dismiss = useDismiss(context, {
    outsidePress: true,
  });
  const role = useRole(context, { role: 'dialog' });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  const isControlledValueSelected =
    controlledSelected && selected.at(0) === controlledSelected;

  return (
    <div className={classes.root}>
      <div
        className={clsx(classes.field, {
          [classes.isOpen]: isOpen,
          [classes.isOpenDisabled]: controlledSelected,
        })}
      >
        <TextInput
          id={`${id}:`}
          labelText=""
          size="lg"
          placeholder={placeholder}
          // TODO: onFocus={() => }
          ref={mergeRefs([buttonRef, refs.setReference])}
          {...getReferenceProps()}
          onChange={(e) => {
            setSearchValue(e.currentTarget.value);
            setIsOpen(true);
          }}
          value={
            isControlledValueSelected
              ? itemToString(controlledSelected)
              : searchValue
          }
          readOnly={isControlledValueSelected}
        />

        {isControlledValueSelected ? (
          <ClearButton
            label="Disconnect knowledge base"
            className={classes.clearButton}
            onClick={() => handleClear()}
          />
        ) : (
          <button className={classes.expandButton}>
            <ChevronDown />
          </button>
        )}
      </div>
      <AnimatePresence>
        {isOpen && (
          <FloatingPortal>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              className={classes.floating}
              {...getFloatingProps()}
            >
              <motion.div
                {...fadeProps({
                  hidden: {
                    transform:
                      placement === 'bottom-start'
                        ? 'translateY(-1rem)'
                        : 'translateY(1rem)',
                  },
                  visible: {
                    transform: 'translateY(0)',
                  },
                })}
              >
                <div
                  className={clsx(classes.listBox, {
                    [classes.multiple]: multiple,
                  })}
                >
                  <div className={classes.list}>
                    {isListItemGroupArray(items) ? (
                      items.map(({ id, groupTitle, items: groupItems }) => (
                        <div className={classes.listGroup} key={id}>
                          <h3>{groupTitle}</h3>

                          <ItemsList<T>
                            items={groupItems}
                            selectedItems={selected}
                            onToggle={handleToggle}
                            itemToElement={itemToElement}
                            itemToString={itemToString}
                            searchValue={searchValue}
                          />
                        </div>
                      ))
                    ) : (
                      <ItemsList<T>
                        items={items}
                        selectedItems={selected}
                        onToggle={handleToggle}
                        itemToElement={itemToElement}
                        itemToString={itemToString}
                        searchValue={searchValue}
                      />
                    )}
                  </div>
                  <div className={classes.actionBar}>
                    {actionBarContentLeft}
                    <Button
                      kind="tertiary"
                      className={classes.addSelectedButton}
                      disabled={!selected.length}
                      onClick={() => handleSubmit()}
                    >
                      {submitButtonTitle}
                      {multiple && (
                        <Tag type="high-contrast">{selected.length}</Tag>
                      )}
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </FloatingPortal>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ListProps<T extends ItemWithId> {
  items: T[];
  searchValue: string;
  selectedItems: T[];
  onToggle: (item: T, toggled: boolean) => void;
  itemToElement?: (item: T) => ReactElement;
  itemToString: (item: T) => string;
}

function ItemsList<T extends ItemWithId>({
  items,
  searchValue,
  selectedItems,
  onToggle,
  itemToElement,
  itemToString,
}: ListProps<T>) {
  const itemsFiltered = useMemo(
    () =>
      searchValue
        ? items.filter((item) =>
            containsStringCi(itemToString(item), searchValue),
          )
        : items,
    [itemToString, items, searchValue],
  );

  return (
    <ul role="listbox">
      {itemsFiltered.map((item) => (
        <ListOption<T>
          key={item.id}
          item={item}
          selectedItems={selectedItems}
          onToggle={onToggle}
          itemToElement={itemToElement ?? itemToString}
        />
      ))}
    </ul>
  );
}

interface OptionProps<T extends ItemWithId> {
  item: T;
  selectedItems: T[];
  onToggle: (item: T, toggled: boolean) => void;
  itemToElement: (item: T) => ReactElement | string;
}

function ListOption<T extends ItemWithId>({
  item,
  selectedItems,
  onToggle,
  itemToElement,
}: OptionProps<T>) {
  const htmlId = useId();
  const selected = selectedItems.some((selectedItem) => selectedItem === item);
  return (
    <li
      key={item.id}
      role="option"
      aria-selected={selected}
      aria-checked={selected}
    >
      <label htmlFor={htmlId}>
        <Checkbox
          id={htmlId}
          labelText=""
          checked={selected}
          onChange={(_, { checked }) => onToggle(item, checked)}
        />
        <span className={classes.optionContent}>{itemToElement(item)}</span>
        <span className={classes.checkedIcon}>
          <Checkmark />
        </span>
      </label>
    </li>
  );
}

export interface DropdownSelectorGroup<T> {
  id: string;
  groupTitle: string | ReactElement;
  items: T[];
}

function isListItemGroupArray<T>(
  items: any[],
): items is DropdownSelectorGroup<T>[] {
  const item = items.at(0);
  return has(item, 'id') && has(item, 'groupTitle') && has(item, 'items');
}

function containsStringCi(source: string, search: string) {
  return source.toLocaleLowerCase().includes(search.toLocaleLowerCase());
}
