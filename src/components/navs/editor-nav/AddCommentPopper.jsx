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
import { selectEntireComment, toggleTextComment } from '../../editor/editorStyleFunctions';

// Prevents the constructor from constantly rerunning, and saves the selection.
let referenceElement = new LinkSelectionRangeRef();

const AddCommentPopper = () => {
	// CONTEXT
	const {
		editorStyles,
		editorStateRef,
		setEditorStateRef,
		displayCommentPopper,
		setDisplayCommentPopper,
		navDataRef,
		commentStructure,
		setCommentStructure,
	} = useContext(LeftNavContext);
	const { editorSettings } = useContext(SettingsContext);

	// STATE
	const [leftOffset, setLeftOffset] = useState(0);
	const [rightOffset, setRightOffset] = useState(0);
	const [shouldUpdatePopper, setShouldUpdatePopper] = useState(false);
	const [editCommentId, setEditCommentId] = useState(false);
	const [editBlockKey, setEditBlockKey] = useState(false);
	const [comment, setComment] = useState('');
	const [selection] = useState(editorStateRef.current.getSelection());

	// REF
	const textareaRef = useRef(null);

	// If editing an existing comment, load the comment
	useEffect(() => {
		if (typeof displayCommentPopper === 'object') {
			const commentId = displayCommentPopper.commentId;
			const blockKey = displayCommentPopper.blockKey;

			if (commentStructure[commentId]) {
				setComment(commentStructure[commentId].comment);
			}

			setEditCommentId(commentId);
			setEditBlockKey(blockKey);
		} else {
			setEditCommentId(false);
			setEditBlockKey(false);
		}
	}, [commentStructure, displayCommentPopper]);

	// Initial rebuild of referenceElement
	useEffect(() => {
		referenceElement = new LinkSelectionRangeRef();
	}, []);

	// Adds a scroll listener to reposition our reference element.
	// Managed here to remove on unmount
	useEffect(() => {
		referenceElement.update();

		window.addEventListener('scroll', referenceElement.update);

		return () => {
			window.removeEventListener('scroll', referenceElement.update);
		};
	}, [referenceElement]);

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
		// Store the comment in the commentStructure. Update if have an editCommentId.
		const commentId = updateComment({
			comment,
			commentStructure,
			setCommentStructure,
			navDataRef,
			editCommentId,
		});

		// For new comments, add the comment metadata to the document text
		if (!editCommentId && comment !== '') {
			toggleTextComment(
				commentId,
				editorStateRef.current,
				setEditorStateRef.current,
				setCommentStructure,
				selection
			);
		}

		// If deleting the content of an existing comment, remove the comment metadata
		if (editCommentId && comment === '') {
			// Select the entire comment
			const wholeCommentSelection = selectEntireComment(
				commentId,
				editBlockKey,
				editorStateRef.current
			);
			console.log('wholeCommentSelection:', wholeCommentSelection);

			// Remove the comment metadata from the entire comment
			toggleTextComment(
				null,
				editorStateRef.current,
				setEditorStateRef.current,
				setCommentStructure,
				wholeCommentSelection,
				'REMOVE'
			);
		}

		setDisplayCommentPopper(false);
	};

	// Focus the text input after the selection has loaded
	useLayoutEffect(() => {
		setTimeout(() => textareaRef.current.focus(), 0);
	}, []);

	return (
		<PopperVerticalContainer
			{...{
				leftOffset,
				rightOffset,
				placement: 'top',
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

export default AddCommentPopper;

// Adds a new comment to the commentStructure
const updateComment = ({
	comment,
	commentStructure,
	setCommentStructure,
	navDataRef,
	editCommentId = 0,
}) => {
	// Increment the max id for the new comment id
	const commentIds = Object.keys(commentStructure).map((id) => Number(id));
	const newId = editCommentId
		? editCommentId
		: Math.max(...(commentIds.length ? commentIds : [0])) + 1;

	// Create the new comment object
	const newComment = {
		doc: navDataRef.current.currentDoc,
		comment,
	};

	setCommentStructure((prev) => {
		// If the comment is blank, delete from commentStructure
		if (comment === '') {
			let newCommentStructure = JSON.parse(JSON.stringify(prev));
			delete newCommentStructure[newId];
			return newCommentStructure;
		} else {
			// Otherwise, update the comment
			return { ...prev, [newId]: newComment };
		}
	});

	return newId;
};
