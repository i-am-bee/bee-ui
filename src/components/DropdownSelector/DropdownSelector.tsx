import { Button, Checkbox, Tag } from '@carbon/react';
import classes from './DropdownSelector.module.scss';
import { Checkmark, ChevronDown, Close } from '@carbon/react/icons';
import { AnimatePresence, motion } from 'framer-motion';
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
import { ReactElement, useCallback, useId, useRef, useState } from 'react';
import { fadeProps } from '@/utils/fadeProps';
import { mergeRefs } from 'react-merge-refs';
import clsx from 'clsx';
import has from 'lodash/has';
import { Tooltip } from '../Tooltip/Tooltip';
import { ClearButton } from '../ClearButton/ClearButton';

type ItemWithId = { id: string };

interface Props<T extends ItemWithId> {
  placeholder?: string;
  multiple?: boolean;
  items: DropdownSelectorGroup<T>[] | T[];
  selected?: T | T[];
  submitButtonTitle?: string;
  actionBarContentLeft?: ReactElement;
  onSubmit: (value: T[] | null) => void;
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
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState<T[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = useCallback(() => {
    onSubmit(selected);
    setIsOpen(false);
  }, [onSubmit, selected]);

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

  return (
    <div className={clsx(classes.root, { [classes.multiple]: multiple })}>
      <Button
        kind="tertiary"
        renderIcon={ChevronDown}
        className={clsx(classes.openButton, {
          [classes.isOpen]: isOpen,
          [classes.isOpenDisabled]: controlledSelected,
        })}
        ref={mergeRefs([buttonRef, refs.setReference])}
        {...getReferenceProps()}
      >
        {controlledSelected && !Array.isArray(controlledSelected) ? (
          <span className={classes.openButtonValue}>
            {itemToString(controlledSelected)}
            <ClearButton
              label="Disconnect knowledge base"
              onClick={() => onSubmit(null)}
            />
          </span>
        ) : (
          <span className={classes.openButtonPlaceholder}>{placeholder}</span>
        )}
      </Button>
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
                <div className={classes.listBox}>
                  <div className={classes.list}>
                    {isListItemGroupArray(items) ? (
                      items.map(({ id, groupTitle, items }) => (
                        <>
                          <h3>{groupTitle}</h3>
                          {items.map((item, index) => (
                            <ListOption<T>
                              key={item.id}
                              item={item}
                              selectedItems={selected}
                              onToggle={handleToggle}
                              itemToElement={itemToElement ?? itemToString}
                            />
                          ))}
                        </>
                      ))
                    ) : (
                      <ul role="listbox">
                        {items.map((item, index) => (
                          <ListOption<T>
                            key={item.id}
                            item={item}
                            selectedItems={selected}
                            onToggle={handleToggle}
                            itemToElement={itemToElement ?? itemToString}
                          />
                        ))}
                      </ul>
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

type OnItemToggle = <T extends ItemWithId>(item: T, toggled: boolean) => void;
