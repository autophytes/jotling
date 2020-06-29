import React, { useCallback, useState, useContext } from 'react';
import DocumentSingleSVG from '../../../assets/svg/DocumentSingleSVG';

import { LeftNavContext } from '../../../contexts/leftNavContext';

import { updateChildName } from '../../../utils/utils';

const NavDocument = ({
	path,
	child,
	currentDoc,
	setCurrentDoc,
	lastClicked,
	setLastClicked,
	editFile,
	setEditFile,
}) => {
	const [fileName, setFileName] = useState(child.name);

	const { docStructure } = useContext(LeftNavContext);

	const handleClick = useCallback(() => {
		currentDoc !== child.fileName && setCurrentDoc(child.fileName);
		setLastClicked({ type: 'doc', id: child.id });
	}, [setCurrentDoc, child]);

	const saveDocNameChange = useCallback(
		(newName) => {
			// update
			updateChildName('doc', child.id, newName, path);
		},
		[child, path]
	);

	console.log(path);

	return (
		<button
			className={'file-nav document' + (currentDoc === child.fileName ? ' active' : '')}
			// key={'doc-' + child.id}
			onClick={handleClick}
			onDoubleClick={() => setEditFile('doc-' + child.id)}>
			<div className='svg-wrapper'>
				<DocumentSingleSVG />
			</div>
			{editFile === 'doc-' + child.id ? (
				<input
					type='text'
					value={fileName}
					onChange={(e) => setFileName(e.target.value)}
					onBlur={(e) => saveDocNameChange(e.target.value)}
				/>
			) : (
				child.name
			)}
			{/* {child.name} */}
		</button>
	);
};

export default NavDocument;
