import React, {
	useContext,
	useState,
	useEffect,
	useCallback,
	useRef,
	useLayoutEffect,
} from 'react';

import PopperVerticalContainer from '../../../containers/PopperVerticalContainer';
import { LinkSelectionRangeRef } from '../LinkSelectionRangeRef';

import { LeftNavContext } from '../../../../contexts/leftNavContext';
import { SettingsContext } from '../../../../contexts/settingsContext';

import { createTagLink, selectionHasEntityType } from '../../../editor/editorFunctions';
import { buildAddToWikiStructure, findAllDocsInFolder, addFile } from '../../navFunctions';
import { getTextSelection } from '../../../../utils/draftUtils';

import PickFolder from './PickFolder';
import DocumentSingleSVG from '../../../../assets/svg/DocumentSingleSVG';

import Swal from 'sweetalert2';
import PickSection from './PickSection';

// Prevents the constructor from constantly rerunning, and saves the selection.
let referenceElement = new LinkSelectionRangeRef();
const sentenceBreakingPunctuation = [
	'.',
	'?',
	'!',
	',',
	'<',
	'>',
	'"',
	'”',
	'“',
	'/',
	'\\',
	'|',
	';',
	':',
	'[',
	']',
	'{',
	'}',
	'(',
	')',
	'=',
	'_',
];

const AddToWikiPopper = () => {
	// STATE
	const [leftOffset, setLeftOffset] = useState(0);
	const [rightOffset, setRightOffset] = useState(0);
	const [isInvalid, setIsInvalid] = useState(false);
	const [newWikiName, setNewWikiName] = useState('New Name');
	const [showPickFolder, setShowPickFolder] = useState(false);
	const [showPickSection, setShowPickSection] = useState(false);
	const [shouldUpdatePopper, setShouldUpdatePopper] = useState(false);
	const [allWikiDocs, setAllWikiDocs] = useState([]);
	const [suggestedDocs, setSuggestedDocs] = useState([]);
	const [selectedDocId, setSelectedDocId] = useState(null);

	// REF
	const newWikiRef = useRef(null);

	// CONTEXT
	const {
		navData,
		editorStyles,
		editorStateRef,
		docStructureRef,
		setDisplayWikiPopper,
	} = useContext(LeftNavContext);
	const { editorSettings } = useContext(SettingsContext);

	// Initial rebuild of referenceElement
	useEffect(() => {
		console.log('recreating the referenceElement');
		referenceElement = new LinkSelectionRangeRef();
	}, []);

	// Check if a LINK-DEST is selected. If so, disable popper.
	useEffect(() => {
		const hasLinkDest = selectionHasEntityType(editorStateRef.current, 'LINK-DEST');
		if (hasLinkDest) {
			setIsInvalid(true);
		}
	}, []);

	// Grabbing a suggested list of all wiki doc names in the selected text
	useEffect(() => {
		// Grab all docs in the wiki tab
		const newAllDocs = findAllDocsInFolder(docStructureRef.current.pages);

		// Get selection Text
		const contentState = editorStateRef.current.getCurrentContent();
		const selectionState = editorStateRef.current.getSelection();
		const selectionText = getTextSelection(contentState, selectionState).toLowerCase();

		// Filter to docs in the wiki tab INSIDE our selection, not our currently open document
		const currentDocId = navData.currentDoc ? Number(navData.currentDoc.slice(3, -5)) : '';
		const matchingDocs = newAllDocs.filter(
			(doc) => selectionText.includes(doc.name.toLowerCase()) && doc.id !== currentDocId
		);

		setAllWikiDocs(newAllDocs);
		setSuggestedDocs(matchingDocs);
	}, [navData]);

	// Adds a scroll listener to reposition our reference element.
	// Managed here to remove on unmount
	useEffect(() => {
		referenceElement.update();
		// !isInvalid && popperInputRef.current.focus();
		window.addEventListener('scroll', referenceElement.update);
		return () => {
			window.removeEventListener('scroll', referenceElement.update);
		};
	}, [referenceElement, isInvalid]);

	// Calculates the left and right popper boundaries
	useEffect(() => {
		referenceElement.update();

		let rootSize = Number(
			window
				.getComputedStyle(document.querySelector(':root'))
				.getPropertyValue('font-size')
				.replace('px', '')
		);

		let leftNav = editorStyles.leftIsPinned ? editorStyles.leftNav * rootSize : 0;
		let rightNav = editorStyles.rightIsPinned ? editorStyles.rightNav * rootSize : 0;

		setLeftOffset(leftNav + 50);
		setRightOffset(rightNav + 50);
	}, [editorStyles, editorSettings, referenceElement]);

	const handleDocClick = (child) => {
		if (child.type === 'doc') {
			return (e) => {
				e.preventDefault();

				// Lets the popper check the click FIRST, then closes the doc section
				setTimeout(() => {
					setSelectedDocId(child.id);
					setShowPickSection(true);
				});
				// createTagLink(
				// 	child.id,
				// 	editorStateRef,
				// 	linkStructureRef,
				// 	navData.currentDoc,
				// 	setEditorStateRef.current,
				// 	setLinkStructure,
				// 	setSyncLinkIdList,
				//  initialSectionKey
				// );
				// setDisplayWikiPopper(false);
				// setShowPickFolder(false);
			};
		}
	};

	const handleNewWikiEnter = useCallback(
		(e) => {
			if (e.key === 'Enter' || e.keyCode === 27) {
				const wikiNames = allWikiDocs.map((item) => item.name.toLowerCase());
				console.log('wikiNames:', wikiNames);

				if (wikiNames.includes(newWikiName.toLowerCase())) {
					// Visual indicator of invalid name
					Swal.fire({
						toast: true,
						title: 'Wiki name must be unique.',
						target: document.getElementById('create-new-wiki-input'),
						position: 'top-start',
						showConfirmButton: false,
						customClass: {
							container: 'new-wiki-validation-alert',
						},
						timer: 3000,
						timerProgressBar: true,
					});
				} else {
					setShowPickFolder(true);
				}
			}
		},
		[newWikiName, allWikiDocs]
	);

	// Find a suggested new wiki page name in the selected text
	useEffect(() => {
		const contentState = editorStateRef.current.getCurrentContent();
		const selectionState = editorStateRef.current.getSelection();

		const selectionText = getTextSelection(contentState, selectionState);

		// Skip short words
		if (selectionText.length < 1) {
			return;
		}

		let properNounArray = [];
		let i = 1;
		while (i < selectionText.length) {
			// Move on if not a capital letter or not preceeded by a space.
			if (
				selectionText.charCodeAt(i) < 65 ||
				selectionText.charCodeAt(i) > 90 ||
				selectionText.charAt(i - 1) !== ' '
			) {
				i++;
				continue;
			}

			let continueBackward = true;
			let skipLoop = false;
			let n = 1;
			// Move on if at the beginning of a sentence
			while (continueBackward) {
				let char = selectionText.charAt(i - n);
				if (![' ', '"', '”'].includes(char) || i - n < 0) {
					continueBackward = false;
					if (['.', '!', '?'].includes(char)) {
						skipLoop = true;
					}
				}
				n++;
			}

			if (skipLoop) {
				i++;
				continue;
			}

			let continueForward = true;
			n = 1;
			// Find the next space
			while (continueForward) {
				let char = selectionText.charAt(i + n);
				let nextCharCode = selectionText.charAt(i + n + 1)
					? selectionText.charCodeAt(i + n + 1)
					: 0;

				if (
					(char === ' ' && (nextCharCode < 65 || nextCharCode > 90)) ||
					sentenceBreakingPunctuation.includes(char) ||
					i + n >= selectionText.length - 1
				) {
					continueForward = false;

					let newNoun = selectionText.slice(i, i + n);
					// Remove ending punctuation (non alphanumeric characters)
					// console.log('newNoun from mr. warrior: ', newNoun.match(/.+(?=[^a-zA-Z\d]+)\b/));
					newNoun = newNoun.replace(/^[^a-z\d]*|[^a-z\d]*$/gi, '');

					// Trim off the possessive form
					if (['’s', "'s"].includes(newNoun.slice(-2))) {
						newNoun = newNoun.slice(0, -2);
					}

					//  Push the new word
					if (newNoun.length > 1) {
						properNounArray.push(newNoun);
					}

					i = i + n + 1;
				}
				n++;
			}
		}

		const allDocs = findAllDocsInFolder(docStructureRef.current.pages);
		const docNamesNoPunc = allDocs.map((item) =>
			item.name.replace(/[^a-z0-9\s]/gi, '').toLowerCase()
		);

		const nameToUse = properNounArray.find(
			(item) => !docNamesNoPunc.includes(item.replace(/[^a-z0-9\s]/gi, '').toLowerCase())
		);

		if (nameToUse) {
			setNewWikiName(nameToUse);
		}

		// TO-DO: if we have multiple words in a row that are capitalized, return all of them
	}, []);

	// After load, focuses on the new wiki name
	useLayoutEffect(() => {
		setTimeout(() => {
			newWikiRef.current.focus();
		}, 0);
	}, []);

	// Reposition the popper when changing sections we're viewing
	useLayoutEffect(() => {
		setShouldUpdatePopper(true);
		console.log('should have fired the popper update');
	}, [showPickFolder, showPickSection]);

	return (
		<PopperVerticalContainer
			closeFn={() => setDisplayWikiPopper(false)}
			{...{
				leftOffset,
				rightOffset,
				referenceElement,
				shouldUpdatePopper,
				setShouldUpdatePopper,
			}}>
			<div className='add-to-wiki-wrapper'>
				{/* Create New Wiki */}
				{!showPickFolder && !showPickSection && (
					<>
						<p className='popper-title'>Create a Wiki</p>
						<div style={{ position: 'relative' }} id='create-new-wiki-input'>
							<button className='file-nav document add-to-wiki new-wiki'>
								<div className='svg-wrapper add-to-wiki'>
									<DocumentSingleSVG />
								</div>
								<input
									type='text'
									value={newWikiName}
									ref={newWikiRef}
									// autoFocus
									onChange={(e) => setNewWikiName(e.target.value)}
									onFocus={(e) => e.target.select()}
									onKeyUp={handleNewWikiEnter}
								/>
							</button>
						</div>
						<hr />
					</>
				)}

				{/* Suggested Wiki */}
				{!showPickFolder && !showPickSection && !!suggestedDocs.length && (
					<>
						<p className='popper-title'>Suggested Wiki</p>
						<div className='folder-contents add-to-wiki'>
							{suggestedDocs.map((item) => (
								<button
									className='file-nav document add-to-wiki'
									onClick={handleDocClick(item)}
									key={'doc-' + item.id}>
									<div className='svg-wrapper add-to-wiki'>
										<DocumentSingleSVG />
									</div>
									<span>{item.name}</span>
								</button>
							))}
						</div>
						<hr />
					</>
				)}

				{/* Choose Wiki */}
				{!showPickFolder && !showPickSection && (
					<>
						<p className='popper-title'>Add to Wiki</p>
						{buildAddToWikiStructure(
							docStructureRef.current.pages,
							'',
							handleDocClick,
							false,
							navData.currentDoc
						)}
					</>
				)}

				{/* Pick Folder - if creating new wiki */}
				{showPickFolder && (
					<PickFolder
						{...{
							newWikiName,
							showPickFolder,
							setShowPickFolder,
							buildAddToWikiStructure,
							setDisplayWikiPopper,
						}}
					/>
				)}

				{/* Pick Section - in an existing wiki */}
				{showPickSection && <PickSection {...{ selectedDocId, setShowPickSection }} />}
			</div>
		</PopperVerticalContainer>
	);
};

export default AddToWikiPopper;
