
console.log("Debug: Setando variaveis");
 
 
BUCKET_NAME = "desafio-cloud22"; //Nome do bucket que deseja inserir o arquivo
TARGET_NAME = "numeros-primos.txt";
TMP_TARGET_PATH = "/tmp/" + TARGET_NAME;
NEXT_TARGET_PATH = "/tmp/" + TARGET_NAME + ".next";
 
console.log("Debug: Importando  modulos");
 
var fs = require("fs");
var lineReader = require("line-reader");
var AWS = require("aws-sdk");
 

console.log("Debug: Inicializando S3 Client");
 
var s3 = new AWS.S3({apiVersion: "2006-03-01", region: "us-east-1"});
 
 
 
function isPrime(num) {
    console.log("Debug: Checando se é primo " + String(num));
    for (var i = 2; i < num; i++) {
        if (num % i === 0) {
            return false;
        }
    }
 
    return num > 1;
}
 
function proximoNum(num) {
    console.log("Debug: Calculando o proximo numero " + String(num));
 
    num = num + 1;
 
    if (isPrime(num)) {
        return num;
    } else {
        return proximoNum(num);
    }
}
 
const handler = function (event, context, callback) {
    console.log("Info: Triggering Handler");
 
    //Verifica se o numero é primo.
 
    console.log("Info: Downloading File");
 
    var downloadParams = {Bucket: BUCKET_NAME, Key: TARGET_NAME};
 
    s3.getObject(downloadParams, function (err, data) {
        if (err) {
            console.log("ERROR: Erro enquanto baixa o arquivo");
            console.error(err.code, "-", err.message);
            throw new Error(err);
        } //   Probably need to delete this file later
 
        console.log("Info: Escrevendo arquivo no caminho temporario");
 
        //   Probably need to delete this file later
        fs.writeFile(TMP_TARGET_PATH, data.Body, function (err) {
            if (err) {
                console.log("ERROR: Error enquanto escrevia o arquivo para o /temp");
                console.log(err.code, "-", err.message);
                console.log("Saindo com Erro");
                throw new Error(err);
            } else {
                console.log("Info: \n" + "Lendo o arquivo");
                lineReader.eachLine(TMP_TARGET_PATH, function (line) {
                    console.log(
                        "Info: Analisando Inteiro do Arquivo:" + String(line)
                    );
 
                    let num = parseInt(line, 10);
 
                    if (isNaN(num)) {
                        console.log("Saindo com Erro");
 
                        throw new Error("NaN!");
                    }
 
                    let primo = proximoNum(num);
                    console.log("Info: Escrevendo o proximo numero ao arquivo");
 
                    fs.writeFileSync(NEXT_TARGET_PATH, primo);
 
                    console.log("Info: Criando FileStream para Upload");
 
                    // Configura o fluxo de arquivos e obtem os parâmetros de upload
                    var fileStream = fs.createReadStream(NEXT_TARGET_PATH);
                    fileStream.on("error", function (err) {
                        console.log("Erro de arquivo", err);
                    });
 
                    var uploadParams = {
                        Bucket: BUCKET_NAME,
                        Key: TARGET_NAME,
                        Body: fileStream
                    };
 
                    console.log("Info: Uploading...");
 

                    // chama o S3 para recuperar o arquivo de upload para o intervalo especificado
                    s3.upload(uploadParams, function (err, data) {
                        if (err) {
                            console.log("ERROR: Error uploading file");
                            console.log(err.code, "-", err.message);
                            console.log("Saindo com Erro");
                            throw new Error(err);
                        }
                        if (data) {
                            console.log("Arquivo enviado com sucesso!!!", data.Location);
                            callback(null, primo);
                        }
                    });
                });
            }
        });
    });
};
 
exports.handler = handler;