interface FIELD_VALIDATION_ERROR {
  type: string;
  location: string;
  path: string;
  value: string;
  msg: string;
}

interface EnvironmentVariables {
  PORT: string;
  DBNAME: string;
  USER_NAME: string;
  PASSWORD: string;
  HOST_NAME: string;
  CLUSTER: boolean;
  NODE_ENV:string;
}

export {
  FIELD_VALIDATION_ERROR,
  EnvironmentVariables
};
