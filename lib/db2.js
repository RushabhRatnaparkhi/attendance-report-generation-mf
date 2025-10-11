import ibmdb from "ibm_db";

const connStr = "DATABASE=attendance;HOSTNAME=localhost;UID=db2inst1;PWD=password;PORT=50000;PROTOCOL=TCPIP";

export async function connectDB2() {
  try {
    const conn = await ibmdb.open(connStr);
    return conn;
  } catch (err) {
    console.error("DB2 connection failed:", err);
    throw err;
  }
}
