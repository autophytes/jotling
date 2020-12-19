import React, { useState, useEffect, useContext } from 'react';
import { remote, ipcRenderer } from 'electron';

import { LeftNavContext } from '../contexts/leftNavContext';

import {
	selectionContainsBlockType,
	selectionHasEntityType,
	selectionInMiddleOfLink,
} from './editor/editorFunctions';

const HiddenContextMenu = () => {
	const [browserParams, setBrowserParams] = useState(null);
	const [electronParams, setElectronParams] = useState(null);

	const { editorStateRef } = useContext(LeftNavContext);

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
			console.log('e: ', e);
			// for (let element of e.path) {
			// 	// DOCUMENT / FOLDER
			// 	if (element.dataset && element.dataset.contextMenuItemType) {
			// 		newBrowserParams = {
			// 			type: element.dataset.contextMenuItemType,
			// 			id: element.dataset.contextMenuItemId,
			// 		};
			// 		break;
			// 	}

			// 	// DOCUMENT TEXT (LINK)
			// 	if (element.dataset && element.dataset.offsetKey) {
			// 		console.log('building the document-text params');
			// 		const selection = editorStateRef.current.getSelection();
			// 		if (!selection.isCollapsed()) {
			// 			console.log("selection isn't collapsed!");
			// 			const hasLink = selectionHasEntityType(editorStateRef.current);
			// 			newBrowserParams = {
			// 				type: 'document-text',
			// 				hasLink: hasLink,
			//       };
			//     }
			//     break;
			// 	}
			// }

			e.path.find((element) => {
				// LEFT NAV DOCUMENT / FOLDER
				if (element.dataset && element.dataset.contextMenuItemType) {
					console.log('has contextMenuItemType');
					newBrowserParams = {
						type: element.dataset.contextMenuItemType,
						id: element.dataset.contextMenuItemId,
						currentTab: element.dataset.contextMenuCurrentTab,
					};
					return true;
				}

				// DOCUMENT TEXT (LINK)
				if (element.dataset && element.dataset.offsetKey) {
					console.log('building the document-text params');
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
							console.log('inMiddleOfLink:', inMiddleOfLink);
						}

						newBrowserParams = {
							type: 'document-text',
							hasLink: hasLinkSource,
							hasLinkDest: hasLinkDest,
							hasWikiSection: hasWikiSection,
							inMiddleOfLink: inMiddleOfLink,
						};
					}
					return true;
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
