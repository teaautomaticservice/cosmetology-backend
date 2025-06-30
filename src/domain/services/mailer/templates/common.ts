export const commonTemplate = ({
  title,
  head,
  content,
}: {
  title: string;
  head: string;
  content: string;
}): string =>
  `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" name="dark only"/>
    <meta name="supported-color-schemes" name="dark only"/>
    <title>${title}</title>
    <style>
      html {
        text-align: center;
        font-family: Arial;
      }
      .body {
        width: 100%;
        height: 100%;
      }
      .wrapper {
        width: 100%;
        height: 100%;
        padding: 30px;
      }
    </style>
    ${head}
  </head>
  <body>
    <div class="wrapper">
      ${content}
    </div>
  </body>
</html>`;