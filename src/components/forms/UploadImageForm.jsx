import React, { useContext, useEffect, useState, useRef } from 'react';
import ImageSVG from '../../assets/svg/ImageSVG';
import PlusSVG from '../../assets/svg/PlusSVG';

import { LeftNavContext } from '../../contexts/leftNavContext';
import PopupModal from '../containers/PopupModal';
import { insertImageBlockData } from '../editor/editorFunctions';
import UploadImageFormCrop from './UploadImageFormCrop';

const UploadImageForm = () => {
	// STATE
	const [uploadImageUrl, setUploadImageUrl] = useState(false);
	const [showChooseImageModal, setShowChooseImageModal] = useState(true);
	const [imageList, setImageList] = useState([]);
	const [activeImgId, setActiveImgId] = useState('');

	// REFS
	const imageInputRef = useRef(null);

	// CONTEXT
	const {
		setShowUploadImage,
		mediaStructure,
		setMediaStructure,
		project,
		editorStateRef,
		setEditorStateRef,
		navData,
	} = useContext(LeftNavContext);

	// Build the list of imageURLs
	useEffect(() => {
		const tempPath = project.tempPath;
		const newImageList = Object.keys(mediaStructure).map((imageId) => ({
			url: `file://${tempPath}/media/media${imageId}.jpeg`,
			imageId: imageId,
		}));

		// if (!newImageList.length) {
		// 	document.getElementById('file-upload-input').click();
		// }

		setImageList(newImageList);
	}, []);

	const onSelectFile = (e) => {
		if (e.target.files && e.target.files.length > 0) {
			const reader = new FileReader();
			reader.addEventListener('load', () => {
				setUploadImageUrl(reader.result);
				setShowChooseImageModal(false);
			});
			reader.readAsDataURL(e.target.files[0]);
			document.getElementById('file-upload-input').value = '';
		}
	};

	// Add the previously uploaded image to the selected block and the mediaStructure
	const handleSubmit = () => {
		const useIds = Object.keys(mediaStructure[activeImgId].uses).map((item) => Number(item));
		console.log('useIds:', useIds);
		const newUseId = useIds.length ? Math.max(...useIds) + 1 : 1;
		console.log('newUseId:', newUseId);

		// Add the file to the mediaStructure
		let newMediaStructure = JSON.parse(JSON.stringify(mediaStructure));
		newMediaStructure[activeImgId].uses = {
			...newMediaStructure[activeImgId].uses,
			[newUseId]: {
				sourceDoc: navData.currentDoc,
			},
		};

		insertImageBlockData(
			activeImgId,
			newUseId,
			editorStateRef.current,
			setEditorStateRef.current
		);

		setMediaStructure(newMediaStructure);
		setShowUploadImage(false);
	};

	return (
		<>
			{showChooseImageModal && (
				<PopupModal
					setDisplayModal={setShowUploadImage}
					width={imageList.length > 2 ? '60rem' : '42rem'}>
					<h2 className='popup-modal-title'>Select Image</h2>
					<hr className='modal-form-hr' />

					{/* Insert Image */}
					<div className='upload-new-image-row'>
						<input
							type='file'
							name='file'
							ref={imageInputRef}
							id='file-upload-input'
							className='hide-input-button'
							accept='image/*'
							onChange={onSelectFile}
						/>
						<div
							className='upload-new-image add-image'
							onClick={() => imageInputRef.current.click()}>
							<ImageSVG />
							{/* <PlusSVG style={{fill: 'white'}}/> */}
							<span style={{ zIndex: 2 }}>+</span>
						</div>

						{/* Display the available images */}
						{imageList.map((item) => (
							<img
								src={item.url}
								key={item.imageId}
								className={
									'upload-new-image ' + (activeImgId === item.imageId ? 'selected' : '')
								}
								onClick={() => setActiveImgId(item.imageId)}
								draggable={false}
							/>
						))}
					</div>

					<button
						className={'submit-button ' + (activeImgId ? '' : 'disabled')}
						onClick={handleSubmit}>
						Submit
					</button>
				</PopupModal>
			)}

			{uploadImageUrl && (
				<UploadImageFormCrop
					setDisplayModal={setShowUploadImage}
					uploadImageUrl={uploadImageUrl}
				/>
			)}
		</>
	);
};

export default UploadImageForm;
