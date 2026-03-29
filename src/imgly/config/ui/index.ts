import type CreativeEditorSDK from '@cesdk/cesdk-js';

import { setupCanvas } from './canvas';
import { setupDock } from './dock';
import { setupInspectorBar } from './inspectorBar';
import { setupNavigationBar } from './navigationBar';
import { setupPanels } from './panel';

export function setupUI(cesdk: CreativeEditorSDK): void {
  setupPanels(cesdk);
  setupNavigationBar(cesdk);
  setupCanvas(cesdk);
  setupInspectorBar(cesdk);
  setupDock(cesdk);
}
