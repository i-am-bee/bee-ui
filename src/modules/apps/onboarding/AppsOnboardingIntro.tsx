import Illustration from './illustration.svg';
import classes from './AppsOnboardingIntro.module.scss';

export function AppsOnboardingIntro() {
  return (
    <div>
      <div className={classes.illustration}>
        <Illustration />
      </div>

      <h2 className={classes.heading}>Apps</h2>

      <div className={classes.content}>
        <p>
          With Bee, you can chat to build reusable apps to automate simple,
          everyday business tasks. Explore examples, start building, and share
          your apps with others.
        </p>
      </div>
    </div>
  );
}
