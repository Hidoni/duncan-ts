import nodeHtmlToImage from 'node-html-to-image';

export async function renderImageFromHtmlTemplate(
    template: string,
    content?: object,
    handlebarHelpers?: {
        [helpers: string]: (...args: any[]) => any;
    }
): Promise<Buffer | null> {
    const image = await nodeHtmlToImage(
        {
            html: template,
            content: content,
            puppeteerArgs: {
                args: ['--no-sandbox'],
            },
            handlebarsHelpers: handlebarHelpers,
        } as any // NOTE: node-html-to-image's typings are broken and don't support their own arguments, so we have to cast to any here
    );
    if (!(image instanceof Buffer)) {
        return null;
    }
    return image;
}
