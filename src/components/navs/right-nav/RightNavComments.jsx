import React, { useContext, useEffect, useState } from 'react';
import { LeftNavContext } from '../../../contexts/leftNavContext';
import { getAllBlockKeys } from '../../../utils/draftUtils';

const RightNavComments = ({ activeTab }) => {
	const { navData, commentStructure, editorStateRef } = useContext(LeftNavContext);

	const [comments, setComments] = useState([]);

	useEffect(() => {
		const currentDoc = navData.currentDoc;

		const commentRegister = Object.keys(commentStructure).reduce((acc, commentId) => {
			if (commentStructure[commentId].doc === currentDoc) {
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

		const currentContent = editorStateRef.current.getCurrentContent();
		const blockKeys = getAllBlockKeys(currentContent);

		let newComments = [];
		for (let key of blockKeys) {
			if (commentRegister.hasOwnProperty(key)) {
				newComments.push(...commentRegister[key]);
			}
		}

		console.log('newComments:', newComments);

		console.log('commentRegister:', commentRegister);
	}, [commentStructure, navData.currentDoc]);

	return (
		<div className='right-nav-content'>
			<p className='left-nav-section-title'>Comments</p>
		</div>
	);
};

export default RightNavComments;
