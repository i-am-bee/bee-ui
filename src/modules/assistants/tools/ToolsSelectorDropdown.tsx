import { Button, Checkbox, Tag } from '@carbon/react';
import classes from './ToolsSelectorDropdown.module.scss';
import { ChevronDown } from '@carbon/react/icons';
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
import { useCallback, useId, useMemo, useRef, useState } from 'react';
import { fadeProps } from '@/utils/fadeProps';
import { mergeRefs } from 'react-merge-refs';
import { useListAllTools } from './useListAllTools';
import { Tool, ToolReference } from '@/app/api/tools/types';
import { useController } from 'react-hook-form';
import {
  AssistantFormValues,
  useAssistantBuilder,
} from '../builder/AssistantBuilderProvider';
import { getToolName, getToolReference } from '@/modules/tools/utils';
import { ToolIcon } from '@/modules/tools/ToolCard';
import { useAppContext } from '@/layout/providers/AppProvider';
import clsx from 'clsx';
import uniq from 'lodash/uniq';

export function ToolsSelectorDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [toolsToAdd, setToolsToAdd] = useState<ToolReference[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const {
    formReturn: { getValues },
  } = useAssistantBuilder();
  const { project } = useAppContext();

  const { tools } = useListAllTools();

  const {
    field: { onChange, value },
  } = useController<AssistantFormValues, 'tools'>({ name: 'tools' });

  const handleAddTools = useCallback(() => {
    if (!toolsToAdd) return;

    const selectedTools = getValues('tools');
    onChange(
      uniq([...selectedTools, ...toolsToAdd]),
      ({ id, type }: ToolReference) => `${id}${type}`,
    );
    setToolsToAdd([]);
    setIsOpen(false);
  }, [getValues, onChange, toolsToAdd]);

  const handleToggleToolToAdd = useCallback(
    (tool: ToolReference, toggled: boolean) => {
      setToolsToAdd((value) =>
        toggled
          ? [...value, tool]
          : value.filter(
              ({ type, id }) => type !== tool.type || id !== tool.id,
            ),
      );
    },
    [],
  );

  const { refs, floatingStyles, context, placement } = useFloating({
    placement: 'bottom-start',
    open: isOpen,
    onOpenChange: setIsOpen,
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

  const availableToolsUser = useMemo(
    () => filterToolsBySelectedValue(tools?.user ?? [], value),
    [tools?.user, value],
  );
  const availableToolsPublic = useMemo(
    () => filterToolsBySelectedValue(tools?.public ?? [], value),
    [tools?.public, value],
  );

  console.log({ toolsToAdd });

  return (
    <div className={classes.root}>
      <Button
        kind="tertiary"
        renderIcon={ChevronDown}
        className={clsx(classes.openButton, { [classes.isOpen]: isOpen })}
        ref={mergeRefs([buttonRef, refs.setReference])}
        onClick={() => setIsOpen(true)}
        {...getReferenceProps()}
      >
        <span className={classes.openButtonTitle}>Browse available tools</span>
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
                    <h3>Custom tools</h3>
                    <ul>
                      {availableToolsUser.map((tool) => (
                        <DropdownListItem
                          key={`${tool.id}${tool.type}`}
                          tool={tool}
                          selectedTools={toolsToAdd}
                          onToggleToolToAdd={handleToggleToolToAdd}
                        />
                      ))}
                    </ul>
                    <h3>Public tools</h3>
                    <ul>
                      {availableToolsPublic.map((tool) => (
                        <DropdownListItem
                          key={`${tool.id}${tool.type}`}
                          tool={tool}
                          selectedTools={toolsToAdd}
                          onToggleToolToAdd={handleToggleToolToAdd}
                        />
                      ))}
                    </ul>
                  </div>
                  <div className={classes.actionBar}>
                    <a href={`/${project.id}/tools/public`} target="_blank">
                      Explore tool library
                    </a>
                    <Button
                      kind="tertiary"
                      className={classes.addSelectedButton}
                      disabled={!toolsToAdd.length}
                      onClick={() => handleAddTools()}
                    >
                      Add selected tools{' '}
                      <Tag type="high-contrast">{toolsToAdd.length}</Tag>
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

function DropdownListItem({
  tool,
  selectedTools,
  onToggleToolToAdd,
}: {
  tool: ToolReference;
  selectedTools: ToolReference[];
  onToggleToolToAdd: (tool: ToolReference, toggled: boolean) => void;
}) {
  const htmlId = useId();
  return (
    <li key={tool.id}>
      <label htmlFor={htmlId}>
        <Checkbox
          id={htmlId}
          labelText=""
          checked={selectedTools.some(
            ({ type, id }) => type === tool.type && id === tool.id,
          )}
          onChange={(_, { checked }) => onToggleToolToAdd(tool, checked)}
        />
        <ToolIcon tool={tool} /> {getToolName(tool)}
      </label>
    </li>
  );
}

function filterToolsBySelectedValue(tools: Tool[], selected: ToolReference[]) {
  return tools
    .filter(
      (tool) =>
        !selected.some(({ type, id }) => type === tool.type && id === tool.id),
    )
    .map(getToolReference);
}
