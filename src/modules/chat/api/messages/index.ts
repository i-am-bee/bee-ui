import { MessagesListQuery } from '@/app/api/threads-messages/types';
import { MessageWithFilesResponse } from '../../types';
import { listMessages } from '@/app/api/threads-messages';
import { readFile } from '@/app/api/files';
import { isNotNull } from '@/utils/helpers';

export async function listMessagesWithFiles(
  organizationId: string,
  projectId: string,
  threadId: string,
  query?: MessagesListQuery,
): Promise<MessageWithFilesResponse | undefined> {
  const response = await listMessages(
    organizationId,
    projectId,
    threadId,
    query,
  );
  if (!response) return response;

  const { data, ...responseWithoutData } = response;

  const messagesWithFiles = await Promise.all(
    data.map(async (message) => {
      const attachments = message.attachments ?? [];

      const files = (
        await Promise.all(
          attachments?.map(async (attachment) => {
            const response = await readFile(
              organizationId,
              projectId,
              attachment.file_id,
            );

            return {
              file: response,
            };
          }),
        )
      ).filter(isNotNull);

      return {
        ...message,
        files,
      };
    }),
  );

  return { ...responseWithoutData, data: messagesWithFiles };
}
