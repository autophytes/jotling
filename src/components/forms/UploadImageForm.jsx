import React, { useState, useContext } from 'react';
import { ipcRenderer } from 'electron';

import ReactCrop from 'react-image-crop';

import { LeftNavContext } from '../../contexts/leftNavContext';

import PopupModal from '../containers/PopupModal';

const CROP = {
	unit: '%',
	width: 75,
	x: 12.5,
	y: 12.5,
	aspect: 1 / 1,
};
const MAX_WIDTH = 1000;
const MAX_HEIGHT = 1000;

const UploadImageForm = () => {
	const [image, setImage] = useState(null);
	const [croppedImgBlob, setCroppedImgBlob] = useState(null);
	const [fileUrl, setFileUrl] = useState(null);
	const [crop, setCrop] = useState({
		unit: '%',
		width: 75,
		height: 75,
		x: 12.5,
		y: 12.5,
		// aspect: 1 / 1,
	});

	const {
		uploadImageUrl,
		setUploadImageUrl,
		mediaStructure,
		setMediaStructure,
		navData,
		project,
	} = useContext(LeftNavContext);

	const makeClientCrop = async (crop) => {
		if (image && crop.width && crop.height) {
			const newUrl = await getCroppedImg(image, crop, 'newFile.jpeg');
			setCroppedImgBlob(newUrl);
		}
	};

	// Uses Canvas to crop and compress the image
	const getCroppedImg = (image, crop, fileName) => {
		console.log('image: ', image);
		const canvas = document.createElement('canvas');
		const scaleX = image.naturalWidth / image.width;
		const scaleY = image.naturalHeight / image.height;

		// Sets the new canvas to be the same size as the cropped image
		// NEED TO FIX - if the width or height is constrained, the other needs to be adjusted to scale
		const unconstrainedWidth = Math.ceil(crop.width * scaleX);
		const unconstrainedHeight = Math.ceil(crop.height * scaleY);
		const maxWidthRatio = MAX_WIDTH / unconstrainedWidth; // If less than 1, we're constrained
		const maxHeightRatio = MAX_HEIGHT / unconstrainedHeight; // If less than 1, we're constrained
		const maxConstraint = Math.min(maxWidthRatio, maxHeightRatio);

		canvas.width = maxConstraint > 1 ? unconstrainedWidth * maxConstraint : unconstrainedWidth;
		canvas.height =
			maxConstraint > 1 ? unconstrainedHeight * maxConstraint : unconstrainedHeight;
		// canvas.width = Math.min(Math.ceil(crop.width * scaleX), MAX_WIDTH);
		// canvas.height = Math.min(Math.ceil(crop.height * scaleY), MAX_HEIGHT);

		const ctx = canvas.getContext('2d');

		// Loads the image in the cavas
		// Arguments: (image, crop x coord., crop y coord., full width, full height,
		//    canvas x coord., canvas y coord., image width, image height)
		ctx.drawImage(
			image,
			crop.x * scaleX,
			crop.y * scaleY,
			crop.width * scaleX,
			crop.height * scaleY,
			0,
			0,
			Math.min(crop.width * scaleX, MAX_WIDTH), // AGAIN, SCALING ISSUES WITH MAX
			Math.min(crop.height * scaleY, MAX_HEIGHT) // AGAIN, SCALING ISSUES WITH MAX
		);

		// Converts the image to a blob, compresses, saves the URL
		return new Promise((resolve, reject) => {
			canvas.toBlob(
				(blob) => {
					if (!blob) {
						//reject(new Error('Canvas is empty'));
						console.error('Canvas is empty');
						return;
					}
					// blob.name = fileName;
					window.URL.revokeObjectURL(fileUrl);
					setFileUrl(window.URL.createObjectURL(blob));
					// resolve(this.fileUrl);
					resolve(blob);
				},
				'image/jpeg',
				0.92
			);
		});
	};

	const submitImage = (e) => {
		// e.stopPropagation();
		// e.preventDefault();
		const mediaIds = Object.keys(mediaStructure).map((item) => Number(item));
		const newId = Math.max(...mediaIds) + 1;
		const fileName = `media${newId}.jpeg`;

		// NEED TO FIX SENDING THE IMAGE
		// https://stackoverflow.com/questions/43562192/write-file-to-disk-from-blob-in-electron-application
		var buffer = new Buffer(croppedImgBlob);

		ipcRenderer.invoke(
			'save-single-document',
			project.tempPath + '/media',
			project.jotsPath,
			fileName,
			buffer,
			false // prevents stringifying the contents
		);

		let newMediaStructure = JSON.parse(JSON.stringify(mediaStructure));
		newMediaStructure[newId] = {
			fileName,
			name: '',
			uses: {
				1: {
					sourceDoc: navData.currentDoc,
				},
			},
		};

		setMediaStructure(newMediaStructure);
		setUploadImageUrl(false);
	};

	return (
		<PopupModal setDisplayModal={setUploadImageUrl}>
			<h2 className='popup-modal-title'>Upload New Image</h2>
			<hr className='modal-form-hr' />

			{/* Uploaded image with crop option */}
			<div className={'img-upload-react-crop-wrapper'}>
				<ReactCrop
					className={'img-upload-react-crop'}
					src={uploadImageUrl}
					crop={crop}
					ruleOfThirds
					// circularCrop
					onImageLoaded={(img) => setImage(img)}
					onComplete={makeClientCrop}
					onChange={(crop) => setCrop(crop)}
				/>

				{/* Submit */}
				{image && (
					<button className='submit-button' onClick={submitImage}>
						Submit
					</button>
				)}
			</div>
		</PopupModal>
	);
};

export default UploadImageForm;
