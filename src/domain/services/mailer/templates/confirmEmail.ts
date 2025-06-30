import { commonTemplate } from './common';

const head =
`<style>
  .content {
    color: red;
  }
</style>`;

const content = ({
  title,
  welcome
}: {
  title: string;
  welcome: string;
}): string =>
  `<div class="content">
  <h1>${title}</h1>
  <p>${welcome}</p>
</div>`;

export const confirmEmail = ({
  title,
  welcome,
}: {
  title: string;
  welcome: string;
}): string => commonTemplate({
  head,
  title,
  content: content({
    title,
    welcome,
  }),
});