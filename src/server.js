const path = require("path");
const grpc = require("@grpc/grpc-js");
const protoLoader = require("@grpc/proto-loader");
const seatsDB = require("./database");
const { EventEmitter } = require("node:events");

const PROTO_PATH = path.resolve(__dirname, "../proto/seat.proto");

const proto = protoLoader.loadSync(PROTO_PATH);
const SeatsPackage = grpc.loadPackageDefinition(proto).seats;
const eventEmitter = new EventEmitter();

const ListAvailableStream = (call) => {
  const sendCurrentAvailableSeats = () => {
    const availableSeats = seatsDB.filter((seat) => seat.status === "available");
    call.write({ seats: availableSeats });
  };
  sendCurrentAvailableSeats();

  eventEmitter.on("booking_succeed", sendCurrentAvailableSeats);
};

const Book = (call, callback) => {
  const { id } = call.request;

  const seat = seatsDB.find((seat) => seat.id === id);
  if (!seat) {
    return callback(new Error("Seat not found"));
  }

  if (seat.status !== "available") {
    return callback(new Error("Seat unavailable"));
  }

  seat.status = "reserved";
  eventEmitter.emit("booking_succeed");

  return callback(null, { seat });
};

function startServer() {
  const server = new grpc.Server();
  server.addService(SeatsPackage.SeatsService.service, { ListAvailableStream, Book });

  server.bindAsync("0.0.0.0:50051", grpc.ServerCredentials.createInsecure(), () => {
    server.start();
    console.log("Server Listening to port 50051");
  });
}

startServer();
