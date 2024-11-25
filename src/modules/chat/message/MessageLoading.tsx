import { Spinner } from '@/components/Spinner/Spinner';
import classes from './MessageLoading.module.scss';

interface Props {
  message: string;
  showSpinner?: boolean;
}

export function MessageLoading({ message, showSpinner }: Props) {
  return (
    <p className={classes.loading}>
      <span>{message}</span>
      {showSpinner && (
        <>
          {' '}
          <Spinner />
        </>
      )}
    </p>
  );
}
