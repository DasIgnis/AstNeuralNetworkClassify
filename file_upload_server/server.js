const express = require('express')
const app = express()
const port = 3000
const bodyParser = require("body-parser");
const multipart = require('connect-multiparty');
const fs = require('fs');
const esprima = require('esprima');
const tf = require('@tensorflow/tfjs')
const npy = require('tfjs-npy')
require('@tensorflow/tfjs-node');

const multipartMiddleware = multipart({
    uploadDir: './uploads'
});

function count(obj, regexp) {
	return (JSON.stringify(obj).match(regexp) || []).length
}

function getMetrics(obj) {
	objLength = count(obj, /type/g)
	
	result = {
		length: objLength,
		varDec: count(obj, /VariableDeclaration/g) / objLength,
		callExp: count(obj, /CallExpression/g) / objLength,
		assignExp: count(obj, /AssignmentExpression/g) / objLength,
		literal: count(obj, /Literal/g) / objLength,
		expStat: count(obj, /ExpressionStatement/g) / objLength,
		ident: count(obj, /Identifier/g) / objLength
	}
	
	return result
}

(async() => {
	const model = await tf.loadLayersModel('file:///generated_model/model.json')
	const max = tf.tensor(JSON.parse(fs.readFileSync('inputMax.json')));
	const min = tf.tensor(JSON.parse(fs.readFileSync('inputMin.json')));
	
	app.post('/api/upload', multipartMiddleware, (req, res) => {
	req.files.uploads.forEach(file => {
		if (file.type==='text/javascript') {
			var script = fs.readFileSync('./' + file.path.replace('\\', '/')).toString();
			try {
				var parsed = esprima.parseScript(script)
				var metrics = getMetrics(parsed)
				
				const data = tf.tensor2d([[metrics.length, metrics.varDec, metrics.callExp, metrics.assignExp]]);
				const normalizedData = data.sub(min).div(max.sub(min));
				const predicted = model.predict(normalizedData).dataSync();
				
				res.json({'result': JSON.stringify(predicted), 'file': file.name});
			}
			catch(e) {
				res.json({'message': 'Parser error occured for file ' + file.name});
			}
		}
		
	});
});
})();





app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));



app.listen(port, () => console.log(`Example app listening on port ${port}!`))