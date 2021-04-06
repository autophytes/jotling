import React, { useContext, useEffect, useRef, useState } from 'react';
import EyeHideSVG from '../../../assets/svg/EyeHideSVG';
import EyeSVG from '../../../assets/svg/EyeSVG';
import { LeftNavContext } from '../../../contexts/leftNavContext';
import { RightNavContext } from '../../../contexts/rightNavContext';
import { getAllBlockKeys } from '../../../utils/draftUtils';

const RightNavComments = ({ activeTab }) => {
	const {
		navData,
		commentStructure,
		editorStateRef,
		showAllTags,
		setShowAllTags,
		editorArchivesRef,
	} = useContext(LeftNavContext);
	const { setFocusCommentId } = useContext(RightNavContext);

	const [comments, setComments] = useState([]);

	const prevCurrentDocRef = useRef(navData.currentDoc);

	// Loading the comments from the commentStructure
	useEffect(() => {
		const currentDoc = navData.currentDoc;

		const commentRegister = Object.keys(commentStructure).reduce((acc, commentId) => {
			if (
				commentStructure[commentId].doc === currentDoc &&
				!commentStructure[commentId].shouldDelete
			) {
				let newAcc = { ...acc };

				let currentBlockKey = commentStructure[commentId].blockKey;
				if (!newAcc.hasOwnProperty(currentBlockKey)) {
					newAcc[currentBlockKey] = [];
				}

				newAcc[currentBlockKey].push({
					...commentStructure[commentId],
					id: commentId,
				});

				return newAcc;
			} else {
				return acc;
			}
		}, {});

		let currentContent;
		// If the current document has not changed, use the editor state
		if (currentDoc === prevCurrentDocRef.current) {
			currentContent = editorStateRef.current.getCurrentContent();
		} else {
			// If the current document HAS changed, load from the editor archives
			//   This is because the editorState updates on a lag
			const editorState = editorArchivesRef.current[currentDoc].editorState;
			currentContent = editorState.getCurrentContent();

			prevCurrentDocRef.current = currentDoc;
		}
		const blockKeys = getAllBlockKeys(currentContent);

		let newComments = [];
		for (let key of blockKeys) {
			if (commentRegister.hasOwnProperty(key)) {
				newComments.push(...commentRegister[key]);
			}
		}

		setComments(newComments);
		console.log('newComments:', newComments);
	}, [commentStructure, navData.currentDoc]);

	const handleCommentClick = (commentId) => {
		const newFocusCommentId = Number(commentId);

		// Set the commentId to highlight
		setFocusCommentId(newFocusCommentId);
		setTimeout(() => {
			setFocusCommentId((prev) => {
				if (prev === newFocusCommentId) {
					return null;
				} else {
					return prev;
				}
			});
		}, 3000);

		// Scroll to the comment decorator
		const commentEl = document.querySelector(
			`.comment-decorator[data-context-menu-comment-id^='${commentId}']`
		);

		if (commentEl) {
			commentEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
		}
	};

	return (
		<>
			<div
				style={{
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					position: 'relative',
				}}>
				<p className='left-nav-section-title'>Comments</p>

				{/* Show / Hide Keys/Links/Comments */}
				<button
					className={'nav-button right-nav-header' + (showAllTags ? ' active' : '')}
					style={{ justifySelf: 'flex-end' }}
					title='Show Wiki Links'
					onMouseDown={(e) => {
						e.preventDefault();
						setShowAllTags(!showAllTags);
					}}>
					{showAllTags ? <EyeSVG /> : <EyeHideSVG />}
				</button>
			</div>
			<div className='right-nav-content'>
				{comments.map((comment) => (
					<p
						key={comment.id}
						className='right-nav-comment'
						onClick={() => handleCommentClick(comment.id)}>
						{comment.comment}
					</p>
				))}
			</div>
		</>
	);
};

export default RightNavComments;
