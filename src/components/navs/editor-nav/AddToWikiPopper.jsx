import React, {
	useContext,
	useState,
	useEffect,
	useCallback,
	useRef,
	useLayoutEffect,
} from 'react';

import PopperVerticalContainer from '../../containers/PopperVerticalContainer';
import { LinkSelectionRangeRef } from './LinkSelectionRangeRef';

import { LeftNavContext } from '../../../contexts/leftNavContext';
import { SettingsContext } from '../../../contexts/settingsContext';

import { createTagLink, selectionHasEntityType } from '../../editor/editorFunctions';
import { buildAddToWikiStructure, findAllDocsInFolder } from '../navFunctions';
import { getTextSelection } from '../../../utils/draftUtils';

import DocumentSingleSVG from '../../../assets/svg/DocumentSingleSVG';

// Prevents the constructor from constantly rerunning, and saves the selection.
let referenceElement = new LinkSelectionRangeRef();

const AddToWikiPopper = ({ setDisplayLinkPopper }) => {
	// STATE
	const [allTags, setAllTags] = useState([]);
	const [tagFilter, setTagFilter] = useState('');
	const [leftOffset, setLeftOffset] = useState(0);
	const [rightOffset, setRightOffset] = useState(0);
	const [isInvalid, setIsInvalid] = useState(false);
	const [newWikiName, setNewWikiName] = useState('New Name');

	// REF
	const newWikiRef = useRef(null);

	// CONTEXT
	const {
		navData,
		editorStyles,
		editorStateRef,
		docStructureRef,
		linkStructureRef,
		setEditorStateRef,
		setLinkStructure,
		setSyncLinkIdList,
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

	const handleDocClick = useCallback(
		(docId) => {
			createTagLink(
				docId,
				editorStateRef,
				linkStructureRef,
				navData.currentDoc,
				setEditorStateRef.current,
				setLinkStructure,
				setSyncLinkIdList
			);
			setDisplayLinkPopper(false);
		},
		[navData]
	);

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
					i + n >= selectionText.length - 1
				) {
					continueForward = false;

					let newNoun = selectionText.slice(i, i + n);
					// Remove ending punctuation (non alphanumeric characters)
					console.log('newNoun from mr. warrior: ', newNoun.match(/.+(?=[^a-zA-Z\d]+)\b/));
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
		const docNames = allDocs.map((item) => item.name.toLowerCase());

		const nameToUse = properNounArray.find((item) => !docNames.includes(item.toLowerCase()));

		if (nameToUse) {
			setNewWikiName(nameToUse);
		}

		// const regex = /(?<!\. |^)[A-Z]\S*(?=\s)/g;
		// const regex = new RegExp('([a-zA-Z]+)\\s([A-Z][a-z]*)\\s([a-zA-Z]+)');
		// const properNouns = selectionText.match(/(?<!\. |^)\b[A-Z]\S*\b/g);

		// // const properNouns = regex.exec(selectionText);
		// console.log('properNouns:', properNouns);

		// TO-DO: if we have multiple words in a row that are capitalized, return all of them
	}, []);

	useLayoutEffect(() => {
		setTimeout(() => {
			newWikiRef.current.focus();
		}, 0);
	}, []);

	return (
		<PopperVerticalContainer
			closeFn={() => setDisplayLinkPopper(false)}
			isContentRendered={!!allTags.length}
			{...{
				leftOffset,
				rightOffset,
				referenceElement,
			}}>
			<div className='add-to-wiki-wrapper'>
				<p className='popper-title'>Create a Wiki</p>
				<button className='file-nav document add-to-wiki'>
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
						onKeyUp={(e) => {
							if (e.key === 'Enter' || e.keyCode === 27) {
								// INSTEAD OF BLURRING, submit the new wiki
								e.target.blur();
							}
						}}
					/>
				</button>
				<hr />
				<p className='popper-title'>Add to Wiki</p>
				{buildAddToWikiStructure(docStructureRef.current.pages, '', handleDocClick)}
			</div>
		</PopperVerticalContainer>
	);
};

export default AddToWikiPopper;
