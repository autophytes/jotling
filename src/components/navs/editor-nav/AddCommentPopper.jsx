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

import { selectionHasEntityType } from '../../editor/editorFunctions';

import TextareaAutosize from 'react-textarea-autosize';
import { toggleTextComment } from '../../editor/editorStyleFunctions';

// Prevents the constructor from constantly rerunning, and saves the selection.
let referenceElement = new LinkSelectionRangeRef();

const AddToWikiPopper = () => {
	// CONTEXT
	const {
		editorStyles,
		editorStateRef,
		setEditorStateRef,
		setDisplayCommentPopper,
		navDataRef,
		commentStructure,
		setCommentStructure,
	} = useContext(LeftNavContext);
	const { editorSettings } = useContext(SettingsContext);

	// STATE
	const [leftOffset, setLeftOffset] = useState(0);
	const [rightOffset, setRightOffset] = useState(0);
	const [isInvalid, setIsInvalid] = useState(false);
	const [showPickFolder, setShowPickFolder] = useState(false);
	const [showPickSection, setShowPickSection] = useState(false);
	const [shouldUpdatePopper, setShouldUpdatePopper] = useState(false);
	const [comment, setComment] = useState('');
	const [selection] = useState(editorStateRef.current.getSelection());
	console.log('selection:', selection);

	// REF
	const textareaRef = useRef(null);

	// Initial rebuild of referenceElement
	useEffect(() => {
		console.log('recreating the referenceElement');
		referenceElement = new LinkSelectionRangeRef();
	}, []);

	// TO-DO - maybe evaluate for existing comments
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

	// Save on close
	const handleSaveOnClose = () => {
		// SAVE OUR COMMENT
		// Create a new/update comment in the commentStructure
		// find our selection
		// apply the entity to the selection
		// save

		/* 
      commentStructure = {
        12: {
          comment: 'This is the song that never ends...',
          doc: 'doc5.json'
        }
      }
    */

		// STILL NEED TO ENABLE EDITING COMMENTS

		// Store the comment in the commentStructure
		const commentId = updateComment({
			comment,
			commentStructure,
			setCommentStructure,
			navDataRef,
		});

		// Currently only works for new comments - eventually add edit
		toggleTextComment(
			commentId,
			editorStateRef.current,
			setEditorStateRef.current,
			setCommentStructure,
			selection
		);

		setDisplayCommentPopper(false);
	};

	useLayoutEffect(() => {
		setTimeout(() => textareaRef.current.focus(), 0);
	}, []);

	// Reposition the popper when changing sections we're viewing
	useLayoutEffect(() => {
		setShouldUpdatePopper(true);
		console.log('should have fired the popper update');
	}, [showPickFolder, showPickSection]);

	return (
		<PopperVerticalContainer
			{...{
				leftOffset,
				rightOffset,
				referenceElement,
				shouldUpdatePopper,
				setShouldUpdatePopper,
				closeFn: handleSaveOnClose,
			}}>
			<div className='add-to-wiki-wrapper'>
				<p className='popper-title'>Comment</p>
				<TextareaAutosize
					minRows={1}
					maxRows={6}
					cols={1}
					ref={textareaRef}
					placeholder='New Comment'
					className='tag-section-value'
					style={{ minWidth: '15rem' }}
					onChange={(e) => {
						setComment(e.target.value);
					}}
					value={comment}
				/>
			</div>
		</PopperVerticalContainer>
	);
};

export default AddToWikiPopper;

// Adds a new comment to the commentStructure - NEED TO UPDATE FOR EDIT
const updateComment = ({ comment, commentStructure, setCommentStructure, navDataRef }) => {
	// Increment the max id for the new comment id
	const commentIds = Object.keys(commentStructure).map((id) => Number(id));
	const newId = Math.max(...(commentIds.length ? commentIds : [0])) + 1;

	// Create the new comment object
	const newComment = {
		doc: navDataRef.current.currentDoc,
		comment,
	};

	setCommentStructure((prev) => ({
		...prev,
		[newId]: newComment,
	}));

	return newId;
};
