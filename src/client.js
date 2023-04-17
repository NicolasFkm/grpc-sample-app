const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");

const PROTO_PATH = path.resolve(__dirname, "../proto/seat.proto");

const proto = protoLoader.loadSync(PROTO_PATH);
const SeatsPackage = grpc.loadPackageDefinition(proto).seats;

const client = new SeatsPackage.SeatsService("localhost:50051", grpc.credentials.createInsecure());

const availableSeatStream = client.ListAvailableStream({});
availableSeatStream.on("data", console.log);

setTimeout(() => {
  client.Book({ id: 2 }, (err, response) => {
    if (err) return console.error(err.details);
    return console.log(response.seat);
  });
}, 3000);
