import type CreativeEditorSDK from '@cesdk/cesdk-js';

export function setupActions(cesdk: CreativeEditorSDK): void {
  cesdk.actions.register('exportDesign', async (exportOptions) => {
    const { blobs, options } = await cesdk.utils.export(exportOptions);
    await cesdk.utils.downloadFile(blobs[0], options.mimeType);
  });
}
