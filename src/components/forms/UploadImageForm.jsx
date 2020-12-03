import React, { useContext, useEffect, useState } from 'react';
import ImageSVG from '../../assets/svg/ImageSVG';

import { LeftNavContext } from '../../contexts/leftNavContext';
import PopupModal from '../containers/PopupModal';
import UploadImageFormCrop from './UploadImageFormCrop';

const UploadImageForm = () => {
	const [uploadImageUrl, setUploadImageUrl] = useState(false);
	const [showChooseImageModal, setShowChooseImageModal] = useState(true);
	const [imageList, setImageList] = useState([]);
	const [activeImgUrl, setActiveImgUrl] = useState('');

	const { setShowUploadImage, mediaStructure, project } = useContext(LeftNavContext);

	// Build the list of imageURLs
	useEffect(() => {
		const tempPath = project.tempPath;
		const newImageList = Object.keys(mediaStructure).map(
			(imageId) => `file://${tempPath}/media/media${imageId}.jpeg`
		);
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

	return (
		<>
			{showChooseImageModal && (
				<PopupModal
					setDisplayModal={setShowUploadImage}
					width={imageList.length > 1 ? '60rem' : null}>
					<h2 className='popup-modal-title'>Upload New Image</h2>
					<hr className='modal-form-hr' />

					{/* Insert Image */}
					<div className='upload-new-image-row'>
						<input
							type='file'
							name='file'
							id='file-upload-input'
							className='hide-input-button'
							accept='image/*'
							onChange={onSelectFile}
						/>
						<label htmlFor='file-upload-input' className='upload-new-image add-image'>
							<ImageSVG />
							<span style={{ zIndex: 2 }}>Upload New Image </span>
						</label>

						{/* Display the available images */}
						{imageList.map((imgUrl) => (
							<img
								src={imgUrl}
								key={imgUrl}
								className={'upload-new-image ' + (activeImgUrl === imgUrl ? 'selected' : '')}
								onClick={() => setActiveImgUrl(imgUrl)}
								draggable={false}
							/>
						))}
					</div>

					<button
						className={'submit-button ' + (activeImgUrl ? '' : 'disabled')}
						onClick={() => console.log('submitted!')}>
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
