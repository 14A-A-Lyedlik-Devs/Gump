using Newtonsoft.Json;
using System.ComponentModel.DataAnnotations;

namespace Gump.WebApi;

public class UpdateUserDto
{
	[Required, JsonProperty("id")]
	public uint Id { get; init; } = 0;

	[Required, JsonProperty("username")]
	public string Username { get; init; } = string.Empty;

	[Required, JsonProperty("password")]
	public string Password { get; init; } = string.Empty;

	[Required, JsonProperty("email")]
	public string Email { get; init; } = string.Empty;

	[Required, JsonProperty("profilePicture")]
	public uint ProfilePictureId { get; init; } = 0;

	[Required, JsonProperty("language")]
	public string Language { get; init; } = string.Empty;

	public override string ToString()
	{
		return JsonConvert.SerializeObject(this);
	}
}
