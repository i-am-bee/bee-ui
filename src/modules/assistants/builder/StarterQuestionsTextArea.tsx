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

import { TextAreaAutoHeight } from '@/components/TextAreaAutoHeight/TextAreaAutoHeight';
import {
  dispatchChangeEventOnFormInputs,
  submitFormOnEnter,
} from '@/utils/formUtils';
import { isNotNull } from '@/utils/helpers';
import { FormLabel, IconButton } from '@carbon/react';
import { Add, Close } from '@carbon/react/icons';
import clsx from 'clsx';
import { FormEvent, useCallback, useRef } from 'react';
import { useController, useForm, useFormContext } from 'react-hook-form';
import { v4 as uuid } from 'uuid';
import {
  AssistantFormValues,
  StarterQuestion,
} from './AssistantBuilderProvider';
import classes from './StarterQuestionsTextArea.module.scss';

interface FormValues {
  input: string;
}

export function StarterQuestionsTextArea() {
  const formRef = useRef<HTMLFormElement>(null);
  const { register, watch, handleSubmit, reset } = useForm<FormValues>({
    mode: 'onChange',
    defaultValues: {
      input: '',
    },
  });
  const { setValue } = useFormContext<AssistantFormValues>();
  const {
    field: { value: questions, onChange },
  } = useController<AssistantFormValues, 'starterQuestions'>({
    name: 'starterQuestions',
  });

  const inputValue = watch('input');

  const hasMaxQuestions = questions && questions.length >= MAX_QUESTIONS;

  const setQuestions = (questions?: StarterQuestion[]) => {
    if (isNotNull(questions)) {
      setValue('starterQuestions', questions);
      onChange(questions);
    }
  };

  const addQuestion = (question: string) => {
    const newQuestion = {
      id: uuid(),
      question,
    };

    setQuestions(questions ? [...questions, newQuestion] : [newQuestion]);
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions?.filter((question) => question.id !== id));
  };

  const updateQuestion = (id: string, value: string) => {
    setQuestions(
      questions?.map((question) =>
        question.id === id ? { ...question, question: value } : question,
      ),
    );
  };

  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    handleSubmit(({ input }) => {
      if (hasMaxQuestions || !input.trim()) {
        return;
      }

      addQuestion(input);
      resetForm();
    })();
  };

  const resetForm = useCallback(() => {
    {
      const formElem = formRef.current;

      if (!formElem) {
        return;
      }

      reset();
      dispatchChangeEventOnFormInputs(formElem);
    }
  }, [reset]);

  return (
    <form className={classes.root} onSubmit={submitForm} ref={formRef}>
      <FormLabel>Starter questions</FormLabel>

      {!hasMaxQuestions && (
        <div className={classes.addHolder}>
          <TextAreaAutoHeight
            className={clsx(classes.textarea, classes.addTextarea)}
            placeholder="Type and add a question that users can select at the start of a new session"
            rows={1}
            maxLength={MAX_QUESTION_LENGTH}
            onKeyDown={submitFormOnEnter}
            {...register('input', { required: true })}
          />

          <IconButton
            wrapperClasses={clsx(classes.button, classes.addButton)}
            label="Enter the starter question to add"
            kind="tertiary"
            align="top-end"
            disabled={!inputValue.trim()}
            type="submit"
          >
            <Add />
          </IconButton>
        </div>
      )}

      {questions && (
        <ul className={classes.list}>
          {questions.map(({ id, question }) => (
            <li key={id} className={classes.item}>
              <TextAreaAutoHeight
                className={clsx(classes.textarea, classes.itemTextarea)}
                rows={1}
                defaultValue={question}
                maxLength={MAX_QUESTION_LENGTH}
                onChange={(event) => updateQuestion(id, event.target.value)}
              />

              <IconButton
                wrapperClasses={clsx(classes.button, classes.removeButton)}
                label="Remove"
                kind="ghost"
                align="top-end"
                onClick={() => removeQuestion(id)}
              >
                <Close />
              </IconButton>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}

const MAX_QUESTIONS = 3;
const MAX_QUESTION_LENGTH = 512;
