import React, { useState, useEffect, useContext } from 'react';
import { remote, ipcRenderer } from 'electron';

import { LeftNavContext } from '../contexts/leftNavContext';

import {
	selectionContainsBlockType,
	selectionHasEntityType,
	selectionInMiddleOfLink,
} from './editor/editorFunctions';
import { findAllDocsInFolder } from './navs/navFunctions';

const HiddenContextMenu = () => {
	const [browserParams, setBrowserParams] = useState(null);
	const [electronParams, setElectronParams] = useState(null);

	const { editorStateRef, docStructureRef } = useContext(LeftNavContext);

	useEffect(() => {
		const browserWindow = remote.getCurrentWindow();

		// Insert / delete document
		//  - data-context-menu-item-type - document
		//  - data-context-menu-item-id - 32
		// Insert / delete folder
		//  - data-context-menu-item-type - folder
		//  - data-context-menu-item-id - 32
		// Add / remove / overwrite link
		//  - if it has a data offset key:
		//    - comb through the content state to see if it has a link or not
		//    - if a link anywhere inside, have remove option. Always have insert option.

		window.addEventListener('contextmenu', (e) => {
			// Determine what context menu options need to be displayed
			// Emit an event to the back end that will create a context menu
			// setBrowserParams('blue');
			let newBrowserParams = {};

			// e.path was not intentionally exposed as an API, but did work
			// e.path.find((element) => {

			// See if the element has data to attach
			const eComposedPath = e.composedPath();
			eComposedPath.find((element) => {
				if (!element.dataset) {
					return;
				}

				// LEFT NAV DOCUMENT / FOLDER
				if (element.dataset.contextMenuItemType) {
					newBrowserParams = {
						...newBrowserParams,
						type: element.dataset.contextMenuItemType,
						id: element.dataset.contextMenuItemId,
						currentTab: element.dataset.contextMenuCurrentTab,
					};
					return true;
				}

				// SHOW DOC TAGS
				if (element.dataset.contextMenuShowTagName) {
					// Find the document that has the tag name
					const tagName = element.dataset.contextMenuShowTagName.toLowerCase();
					const docMatch = findAllDocsInFolder(docStructureRef.current.pages).find(
						(doc) => doc.name.toLowerCase() === tagName
					);

					// Pass the matching file name name
					newBrowserParams.showTagDocName = docMatch.fileName;

					// Don't return true b/c the document text up the chain should fire too
				}

				// DOCUMENT TEXT (LINK)
				if (element.dataset.offsetKey) {
					const selection = editorStateRef.current.getSelection();
					if (!selection.isCollapsed()) {
						const hasLinkDest = selectionHasEntityType(editorStateRef.current, 'LINK-DEST');
						const hasWikiSection = selectionContainsBlockType(
							editorStateRef.current,
							'wiki-section'
						);

						// No insert/remove link options if selecting a destination link
						const hasLinkSource = selectionHasEntityType(
							editorStateRef.current,
							'LINK-SOURCE'
						);

						let inMiddleOfLink = false;
						if (hasLinkSource) {
							inMiddleOfLink = selectionInMiddleOfLink(editorStateRef.current);
						}

						newBrowserParams = {
							...newBrowserParams,
							type: 'document-text',
							hasLink: hasLinkSource,
							hasLinkDest: hasLinkDest,
							hasWikiSection: hasWikiSection,
							inMiddleOfLink: inMiddleOfLink,
						};
					}
				}
			});

			setBrowserParams(newBrowserParams);
		});

		browserWindow.webContents.on('context-menu', (event, props) => {
			setElectronParams(props);
		});
	}, []);

	// Fire the message to the back-end to create the context menu
	useEffect(() => {
		if (browserParams && electronParams) {
			console.log('the create context menu should fire now!');
			ipcRenderer.invoke('create-context-menu', browserParams, electronParams);
			setBrowserParams(null);
			setElectronParams(null);
		}
	}, [browserParams, electronParams]);

	return <></>;
};

export default HiddenContextMenu;
