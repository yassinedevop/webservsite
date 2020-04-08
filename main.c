#include <sys/types.h>
#include <sys/socket.h>
#include <netinet/in.h>
#include <arpa/inet.h>
#include <netdb.h>
#include <unistd.h>
#include <errno.h>


#define ISVALIDSOCKET(s) ((s) >= 0)
#define CLOSESOCKET(s) close(s)
#define SOCKET int
#define GETSOCKETERRNO() (errno)


#include <stdio.h>
#include <string.h>
#include <stdlib.h>

char LED1[] = "OFF";
char LED2[] = "OFF";
char LED3[] = "OFF";
char LED4[] = "OFF";
char SW[] = "0000";
char temp[6];
char *player, *namex, *namey;

const char *get_content_type(const char* path) {
	const char *last_dot = strrchr(path, '.');
	if (last_dot) {
		if (strcmp(last_dot, ".css") == 0)
			return "text/css";
		if (strcmp(last_dot, ".csv") == 0)
			return "text/csv";
		if (strcmp(last_dot, ".gif") == 0)
			return "image/gif";
		if (strcmp(last_dot, ".htm") == 0)
			return "text/html";
		if (strcmp(last_dot, ".html") == 0)
			return "text/html";
		if (strcmp(last_dot, ".ico") == 0)
			return "image/x-icon";
		if (strcmp(last_dot, ".jpeg") == 0)
			return "image/jpeg";
		if (strcmp(last_dot, ".jpg") == 0)
			return "image/jpeg";
		if (strcmp(last_dot, ".js") == 0)
			return "application/javascript";
		if (strcmp(last_dot, ".json") == 0)
			return "application/json";
		if (strcmp(last_dot, ".png") == 0)
			return "image/png";
		if (strcmp(last_dot, ".pdf") == 0)
			return "application/pdf";
		if (strcmp(last_dot, ".svg") == 0)
			return "image/svg+xml";
		if (strcmp(last_dot, ".txt") == 0)
			return "text/plain";
	}

	return "application/octet-stream";
}

SOCKET create_socket(const char* host, const char *port) {
	printf("Configuring local address...\n");
	struct addrinfo hints;
	memset(&hints, 0, sizeof(hints));
	hints.ai_family = AF_INET;
	hints.ai_socktype = SOCK_STREAM;
	hints.ai_flags = AI_PASSIVE;

	struct addrinfo *bind_address;
	getaddrinfo(host, port, &hints, &bind_address);

	printf("Creating socket...\n");
	SOCKET socket_listen;
	socket_listen = socket(bind_address->ai_family, bind_address->ai_socktype,
			bind_address->ai_protocol);
	if (!ISVALIDSOCKET(socket_listen)) {
		fprintf(stderr, "socket() failed. (%d)\n", GETSOCKETERRNO());
		exit(1);
	}

	printf("Binding socket to local address...\n");
	if (bind(socket_listen, bind_address->ai_addr, bind_address->ai_addrlen)) {
		fprintf(stderr, "bind() failed. (%d)\n", GETSOCKETERRNO());
		exit(1);
	}
	freeaddrinfo(bind_address);

	printf("Listening...\n");
	if (listen(socket_listen, 10) < 0) {
		fprintf(stderr, "listen() failed. (%d)\n", GETSOCKETERRNO());
		exit(1);
	}

	return socket_listen;
}

#define MAX_REQUEST_SIZE 2047

struct client_info {
	socklen_t address_length;
	struct sockaddr_storage address;
	SOCKET socket;
	char request[MAX_REQUEST_SIZE + 1];
	int received;
	struct client_info *next;
};

static struct client_info *clients = 0;

struct client_info *get_client(SOCKET s) {
	struct client_info *ci = clients;

	while (ci) {
		if (ci->socket == s)
			break;
		ci = ci->next;
	}

	if (ci)
		return ci;
	struct client_info *n = (struct client_info*) calloc(1,
			sizeof(struct client_info));

	if (!n) {
		fprintf(stderr, "Out of memory.\n");
		exit(1);
	}

	n->address_length = sizeof(n->address);
	n->next = clients;
	clients = n;
	return n;
}

void drop_client(struct client_info *client) {
	CLOSESOCKET(client->socket);

	struct client_info **p = &clients;

	while (*p) {
		if (*p == client) {
			*p = client->next;
			free(client);
			return;
		}
		p = &(*p)->next;
	}

	fprintf(stderr, "drop_client not found.\n");
	exit(1);
}

const char *get_client_address(struct client_info *ci) {
	static char address_buffer[100];
	getnameinfo((struct sockaddr*) &ci->address, ci->address_length,
			address_buffer, sizeof(address_buffer), 0, 0,
			NI_NUMERICHOST);
	return address_buffer;
}

fd_set wait_on_clients(SOCKET server) {
	fd_set reads;
	FD_ZERO(&reads);
	FD_SET(server, &reads);
	SOCKET max_socket = server;

	struct client_info *ci = clients;

	while (ci) {
		FD_SET(ci->socket, &reads);
		if (ci->socket > max_socket)
			max_socket = ci->socket;
		ci = ci->next;
	}

	if (select(max_socket + 1, &reads, 0, 0, 0) < 0) {
		fprintf(stderr, "select() failed. (%d)\n", GETSOCKETERRNO());
		exit(1);
	}

	return reads;
}

void send_400(struct client_info *client) {
	const char *c400 = "HTTP/1.1 400 Bad Request\r\n"
			"Connection: close\r\n"
			"Content-Length: 11\r\n\r\nBad Request";
	send(client->socket, c400, strlen(c400), 0);
	drop_client(client);
}

void send_404(struct client_info *client) {
	const char *c404 = "HTTP/1.1 404 Not Found\r\n"
			"Connection: close\r\n"
			"Content-Length: 9\r\n\r\nNot Found";
	send(client->socket, c404, strlen(c404), 0);
	drop_client(client);
}

void serve_resource(struct client_info *client, const char *path) {

	printf("serve_resource %s %s\n", get_client_address(client), path);

	if (strcmp(path, "/") == 0) {
		path = "index.html";
		printf("searching index.html \n");
	}
//    if(strcmp(path+1,"favicon.ico") == 0){
//    	path = "favicon.ico";
//    	printf("serving favicon.ico \n");
//    }
	if (strlen(path) > 100) {
		send_400(client);
		return;
	}

	if (strstr(path, "..")) {
		send_404(client);
		return;
	}

	char full_path[128];
	bzero(full_path, 128);
//    sprintf(full_path, "public%s", path);

	sprintf(full_path, "site/%s", path);

	FILE *fp = fopen(full_path, "rb");

	if (!fp) {
		send_404(client);
		return;
	}

	fseek(fp, 0L, SEEK_END);
	size_t cl = ftell(fp);
	rewind(fp);

	const char *ct = get_content_type(full_path);

#define BSIZE 1024
	char buffer[BSIZE];

	sprintf(buffer, "HTTP/1.1 200 OK\r\n");
	send(client->socket, buffer, strlen(buffer), 0);

	sprintf(buffer, "Connection: close\r\n");
	send(client->socket, buffer, strlen(buffer), 0);

	sprintf(buffer, "Content-Length: %zu\r\n", cl);
	send(client->socket, buffer, strlen(buffer), 0);

	sprintf(buffer, "Content-Type: %s; charset=UTF-8\r\n", ct);
	send(client->socket, buffer, strlen(buffer), 0);

	sprintf(buffer, "\r\n");
	send(client->socket, buffer, strlen(buffer), 0);

	int r = fread(buffer, 1, BSIZE, fp);
	while (r) {
		send(client->socket, buffer, r, 0);
		r = fread(buffer, 1, BSIZE, fp);
	}

	fclose(fp);
	drop_client(client);
}
int all_OK(char *buf, char *fext, int fsize) {

	char lbuf[40];

	strcpy(buf, "HTTP/1.0 200 OK\r\nContent-Type: ");

	if (fext == NULL)
		strcat(buf, "text/html"); /* for unknown types */
	else if (!strncmp(fext, "htm", 3))
		strcat(buf, "text/html"); /* html */
	else if (!strncmp(fext, "jpg", 3))
		strcat(buf, "image/jpeg");
	else if (!strncmp(fext, "gif", 3))
		strcat(buf, "image/gif");
	else if (!strncmp(fext, "js", 2))
		strcat(buf, "text/javascript");
	else if (!strncmp(fext, "pdf", 2))
		strcat(buf, "application/pdf");
	else if (!strncmp(fext, "css", 2))
		strcat(buf, "text/css");
	else
		strcat(buf, "text/plain"); /* for unknown types */
	strcat(buf, "\r\n");

	sprintf(lbuf, "Content-length: %d", fsize);
	strcat(buf, lbuf);
	strcat(buf, "\r\n");

	strcat(buf, "Connection: close\r\n");
	strcat(buf, "\r\n");

	return strlen(buf);

}
int is_cmd_led(char *buffer) {

	buffer += 6;

	return (!strncmp(buffer, "cmd", 3) && !strncmp(buffer + 4, "ledxhr", 6));

}
int is_cmd_led1(char *buffer) {

	buffer += 6;

	return (!strncmp(buffer, "cmd", 3) && !strncmp(buffer + 4, "led1xhr", 7));

}
int is_cmd_led2(char *buffer) {

	buffer += 6;

	return (!strncmp(buffer, "cmd", 3) && !strncmp(buffer + 4, "led2xhr", 7));

}
int is_cmd_led3(char *buffer) {

	buffer += 6;

	return (!strncmp(buffer, "cmd", 3) && !strncmp(buffer + 4, "led3xhr", 7));
}
int is_cmd_switch(char *buffer) {
	buffer += 6;

	return (!strncmp(buffer, "cmd", 3) && !strncmp(buffer + 4, "switchxhr", 9));
}
int is_game_posw(char *buffer) {
	buffer += 6;
	return (!strncmp(buffer, "game", 4) && !strncmp(buffer + 5, "posw", 4));
}
int is_game_posr(char *buffer) {
	buffer += 6;
	return (!strncmp(buffer, "game", 4) && !strncmp(buffer + 5, "posr", 4));
}
int is_cmd_temp(char *buffer){

	buffer +=6;
	return(!strncmp(buffer , "cmd" , 3)&& !strncmp(buffer+4 , "temp" , 4));
}

void post(struct client_info *client, char *buffer) {

	int len = 0;
	FILE *fp;

	if (is_cmd_led(buffer) || is_cmd_led1(buffer) || is_cmd_led2(buffer)
			|| is_cmd_led3(buffer)) {

		fp = fopen("LEDs.txt", "w+");
		fseek(fp, 0L, SEEK_END);
		if (is_cmd_led(buffer)) {
			if (!strcmp(LED1, "OFF")) {
				strcpy(LED1, "ON");
			} else {
				strcpy(LED1, "OFF");
			}
		}
		if (is_cmd_led1(buffer)) {
			if (!strcmp(LED2, "OFF")) {
				strcpy(LED2, "ON");
			} else {
				strcpy(LED2, "OFF");
			}

		}
		if (is_cmd_led2(buffer)) {
			if (!strcmp(LED3, "OFF")) {
				strcpy(LED3, "ON");
			} else {
				strcpy(LED3, "OFF");
			}

		}
		if (is_cmd_led3(buffer)) {
			if (!strcmp(LED4, "OFF")) {
				strcpy(LED4, "ON");
			} else {
				strcpy(LED4, "OFF");
			}

		}
		fprintf(fp, "*************etat des LEDs************\n");
		fprintf(fp, "LED1 est %s\n", LED1);
		fprintf(fp, "LED2 est %s\n", LED2);
		fprintf(fp, "LED3 est %s\n", LED3);
		fprintf(fp, "LED4 est %s\n", LED4);
		fprintf(fp, "**************************************\n");

		len = all_OK(buffer, "txt", 1);

		send(client->socket, buffer, len, 0);

		sprintf(buffer, "\r\n");
		send(client->socket, buffer, strlen(buffer), 0);
	} else if (is_cmd_switch(buffer)) {

		fp = fopen("switch.txt", "r");

		len = all_OK(buffer, "txt", 4);
		send(client->socket, buffer, len, 0);

		fgets(SW, 5, fp);
		send(client->socket, SW, 4, 0);

	}
	else if(is_cmd_temp(buffer)){
		fp = fopen("temp.txt" , "r");

		len = all_OK(buffer, "txt", 4);
		send(client->socket, buffer, len, 0);

		fgets(temp, 6, fp);
		send(client->socket, temp, 5, 0);

	}

	fclose(fp);
	drop_client(client);

}

int main() {

	SOCKET server = create_socket(0, "1200");

	while (1) {

		fd_set reads;
		reads = wait_on_clients(server);

		if (FD_ISSET(server, &reads)) {
			struct client_info *client = get_client(-1);

			client->socket = accept(server,
					(struct sockaddr*) &(client->address),
					&(client->address_length));

			if (!ISVALIDSOCKET(client->socket)) {
				fprintf(stderr, "accept() failed. (%d)\n",
				GETSOCKETERRNO());
				return 1;
			}

//            printf("New connection from %s.\n",
//                    get_client_address(client));
		}

		struct client_info *client = clients;
		while (client) {
			struct client_info *next = client->next;

			if (FD_ISSET(client->socket, &reads)) {

				if (MAX_REQUEST_SIZE == client->received) {
					send_400(client);
					client = next;
					continue;
				}

				int r = recv(client->socket, client->request + client->received,
				MAX_REQUEST_SIZE - client->received, 0);

				if (r < 1) {
					printf("Unexpected disconnect from %s.\n",
							get_client_address(client));
					drop_client(client);

				} else {
					client->received += r;
					client->request[client->received] = 0;

					char *q = strstr(client->request, "\r\n\r\n");
					if (q) {
						*q = 0;

						if (strncmp("GET /", client->request, 5)) {
							if (strncmp("POST /", client->request, 6) == 0) {
								post(client, client->request);

							} else {
								send_400(client);
							}
						} else {
							char *path = client->request + 4;
							char *end_path = strstr(path, " ");
							if (!end_path) {
								send_400(client);
							} else {
								*end_path = 0;
								serve_resource(client, path);
							}

						}
					}
				}
			}

			client = next;
		}

	}

	printf("\nClosing socket...\n");
	CLOSESOCKET(server);

	printf("Finished.\n");
	return 0;
}

