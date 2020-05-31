const esprima = require('esprima');
const fs = require('fs');

function count(obj, regexp) {
		return (JSON.stringify(obj).match(regexp) || []).length
	}

	function getMetrics(obj, type) {
		objLength = count(obj, /type/g)
		
		result = {
			type: type,
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

	function parseFolder(folderName, type) {
		res = []
		fs.readdirSync(folderName).forEach(file => {
				var script = fs.readFileSync(folderName + '/' + file).toString();
				try {
					var parsed = esprima.parseScript(script);
					
					res.push(getMetrics(parsed, type))
					
					fs.writeFile(folderName + '_jsons/' + file.replace('.txt', '.json'), JSON.stringify(getMetrics(parsed, type)), function (err) {
					  if (err) return console.log(err);
					});
				}
				catch (e) {
					console.log("Error in file " + folderName + '/' + file + ' ' + e)
				}
			})
		return res
	}

module.exports = {
	
	prepareData: function() {
		data = []
		data = data.concat(parseFolder('./cryptominers', 1))
		data = data.concat(parseFolder('./keylogger', 2))
		//console.log(data);
		return data;
	}	

}